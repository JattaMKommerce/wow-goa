<?php
/**
 * WOW GOA - Central Authoritative Booking Service (Phase 4, 5, 6)
 *
 * Single authoritative backend booking pipeline handling:
 * - Authentication & input validation
 * - Authoritative shared inventory availability & anti-double-booking validation
 * - Authoritative server-side B2B pricing calculation
 * - Customer identity & permanent DOB management
 * - Customer wallet deduction with transaction safety
 * - Master booking insertion
 * - Master-Child booking creation for packages (Hotel, Vehicle, Driver child allocations)
 * - Atomic database transactions with rollback on failure
 */

class BookingServiceException extends Exception {
    protected $httpCode = 400;
    protected $isConflict = false;

    public function __construct($message, $httpCode = 400, $isConflict = false) {
        parent::__construct($message);
        $this->httpCode = $httpCode;
        $this->isConflict = $isConflict;
    }

    public function getHttpCode() {
        return $this->httpCode;
    }

    public function isConflict() {
        return $this->isConflict;
    }
}

class BookingService {

    /**
     * Create an authoritative booking (D2C or B2B) within an atomic database transaction.
     *
     * @param PDO $pdo Active PDO database handle
     * @param array $payload Client booking request payload
     * @param array|null $actor Authenticated actor (partner or user)
     * @param string $channel 'D2C' or 'B2B'
     * @return array Standardized booking response
     * @throws BookingServiceException
     */
    public static function createBooking(PDO $pdo, array $payload, $actor = null, string $channel = 'D2C'): array {
        $actor = is_array($actor) ? $actor : null;
        $channel = strtoupper(trim($channel ?: 'D2C'));
        $isB2B = ($channel === 'B2B');

        // 1. Idempotency Check
        $idempotencyKey = trim($payload['idempotency_key'] ?? '');
        if (!empty($idempotencyKey)) {
            $stmtIdemp = $pdo->prepare("SELECT * FROM bookings WHERE idempotency_key = ? LIMIT 1");
            $stmtIdemp->execute([$idempotencyKey]);
            $existing = $stmtIdemp->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                return [
                    'success' => true,
                    'idempotent' => true,
                    'message' => 'Booking retrieved via idempotency key.',
                    'booking_id' => $existing['id'],
                    'id' => $existing['id'],
                    'booking' => $existing,
                    'data' => $existing
                ];
            }
        }

        // 2. Validate Guest / Customer Details
        $custName = trim($payload['name'] ?? ($payload['customer_name'] ?? ($payload['guest_name'] ?? ($payload['customer']['name'] ?? ''))));
        $rawPhone = preg_replace('/\D/', '', $payload['phone'] ?? ($payload['customer_phone'] ?? ($payload['guest_phone'] ?? ($payload['customer']['phone'] ?? ''))));
        $custEmail = strtolower(trim($payload['email'] ?? ($payload['customer_email'] ?? ($payload['guest_email'] ?? ($payload['customer']['email'] ?? '')))));
        $rawDob = trim($payload['date_of_birth'] ?? ($payload['dob'] ?? ($payload['guest_dob'] ?? ($payload['customer']['dob'] ?? ''))));

        if (empty($custName)) {
            throw new BookingServiceException("Guest / Customer name is required.", 400);
        }
        if (empty($rawPhone) || strlen($rawPhone) < 10) {
            throw new BookingServiceException("A valid 10-digit mobile phone number is required.", 400);
        }

        $last10 = substr($rawPhone, -10);

        // 3. Normalise Dates, Service Type & Item
        $rawDepDate = $payload['start_date'] ?? ($payload['departure_date'] ?? ($payload['pickup_date'] ?? ($payload['check_in_date'] ?? null)));
        $rawRetDate = $payload['end_date'] ?? ($payload['return_date'] ?? ($payload['drop_date'] ?? ($payload['check_out_date'] ?? null)));

        if (empty($rawDepDate) || empty($rawRetDate)) {
            throw new BookingServiceException("Pickup date and drop date are required.", 400);
        }

        $depDate = substr(trim($rawDepDate), 0, 10);
        $retDate = substr(trim($rawRetDate), 0, 10);

        if (empty($depDate) || empty($retDate) || !strtotime($depDate) || !strtotime($retDate)) {
            throw new BookingServiceException("Pickup date and drop date are required.", 400);
        }

        $calcDays = 1;
        if (!empty($depDate) && !empty($retDate)) {
            $tDiff = strtotime($retDate) - strtotime($depDate);
            if ($tDiff > 0) {
                $calcDays = max(1, (int)round($tDiff / 86400));
            }
        }
        $daysCount = max(1, intval($payload['booking_days'] ?? ($payload['days'] ?? $calcDays)));
        $qtyCount = max(1, intval($payload['qty'] ?? ($payload['num_rooms'] ?? ($payload['guests'] ?? 1))));
        $durationVal = $payload['duration'] ?? ($daysCount . ' Nights / ' . ($daysCount + 1) . ' Days');

        $serviceType = strtolower(trim($payload['type'] ?? ($payload['service_type'] ?? 'package')));
        if ($serviceType === 'car' || $serviceType === 'bike' || $serviceType === 'selfdrive') {
            $serviceType = 'vehicle';
        }
        $itemId = trim($payload['item_id'] ?? '');

        // Authoritative classification for vehicle packages and fleets
        $pkgType = strtolower(trim($payload['package_type'] ?? ''));
        if ($pkgType === 'self drive package' || $pkgType === 'self-drive package' || $pkgType === 'car rental' || $pkgType === 'bike rental') {
            $serviceType = 'vehicle';
        }
        if ($serviceType !== 'vehicle' && !empty($itemId)) {
            if (str_starts_with($itemId, 'car-') || str_starts_with($itemId, 'bike-') || str_starts_with($itemId, 'lux-def-') || str_starts_with($itemId, 'bike-def-') || str_starts_with($itemId, 'car_') || str_starts_with($itemId, 'bike_')) {
                $serviceType = 'vehicle';
            }
        }

        // 3b. Authoritative Vehicle Eligibility Validation (DOB, Age, Driving License)
        $isBikeRental = ($payload['type'] ?? '') === 'bike' || ($payload['service_type'] ?? '') === 'bike' || str_starts_with($itemId, 'bike-') || str_starts_with($itemId, 'bike_') || str_starts_with($itemId, 'bike-def-');
        $rawDriverServiceType = strtoupper(trim($payload['driver_service_type'] ?? ($payload['extra_details']['driver_service_type'] ?? '')));
        $isDriverExplicit = in_array($rawDriverServiceType, ['PICKUP', 'DROP', 'FULL']) ||
            (!empty($payload['driver_required']) && ($payload['driver_required'] == 1 || $payload['driver_required'] === '1' || $payload['driver_required'] === 'yes' || $payload['driver_required'] === true));
        $isVehicleWithDriver = $isDriverExplicit && !$isBikeRental;

        $rawLicense = trim($payload['license'] ?? ($payload['driving_license'] ?? ($payload['guest_license'] ?? ($payload['id_number'] ?? ''))));

        if ($serviceType === 'vehicle') {
            if (!$isVehicleWithDriver && strtotime($retDate) <= strtotime($depDate)) {
                throw new BookingServiceException("Drop-off date cannot be the same as or before pickup date for Self Drive rentals.", 400);
            }

            // Check if customer is repeat customer with stored DOB in database if not explicitly provided in payload
            if (empty($rawDob) && !empty($last10)) {
                try {
                    $chkCust = $pdo->prepare("SELECT date_of_birth FROM users WHERE (phone != '' AND (phone LIKE ? OR phone LIKE ?)) OR (email != '' AND LOWER(email) = ?) LIMIT 1");
                    $chkCust->execute(["%$last10", "%$rawPhone", $custEmail]);
                    $existingCust = $chkCust->fetch(PDO::FETCH_ASSOC);
                    if ($existingCust && !empty($existingCust['date_of_birth'])) {
                        $rawDob = trim($existingCust['date_of_birth']);
                    }
                } catch (Exception $e) {}
            }

            if (empty($rawDob)) {
                throw new BookingServiceException("Date of birth is required for vehicle bookings.", 400);
            }

            $dobTimestamp = strtotime($rawDob);
            if (!$dobTimestamp) {
                throw new BookingServiceException("Please provide a valid date of birth.", 400);
            }

            try {
                $dobDate = new DateTime($rawDob);
                $pickupDateObj = new DateTime($depDate);
            } catch (Exception $e) {
                throw new BookingServiceException("Invalid date format for date of birth or pickup date.", 400);
            }

            if ($pickupDateObj < $dobDate) {
                throw new BookingServiceException("Date of birth cannot be after the vehicle pickup date.", 400);
            }

            // Self Drive rentals (!isVehicleWithDriver):
            // - DOB mandatory (checked above)
            // - Age >= 18 on vehicle pickup date
            // - Driving License mandatory
            if (!$isVehicleWithDriver) {
                $ageInterval = $dobDate->diff($pickupDateObj);
                $calculatedAge = $ageInterval->y;

                if ($calculatedAge < 18) {
                    throw new BookingServiceException("Primary driver must be 18 years or older on pickup date for Self Drive rentals.", 400);
                }

                if (empty($rawLicense)) {
                    throw new BookingServiceException("Driving License is required for Self Drive rentals.", 400);
                }

                $cleanLicense = strtoupper(preg_replace('/[\s\-_\\/]/', '', $rawLicense));
                if (strlen($cleanLicense) < 8 || strlen($cleanLicense) > 20 || preg_match('/^(\w)\1+$/', $cleanLicense) || !preg_match('/^[A-Z0-9]{8,20}$/', $cleanLicense) || !preg_match('/\d{4,}/', $cleanLicense)) {
                    throw new BookingServiceException("Please provide a valid Driving License number (minimum 8 alphanumeric characters, e.g. DL-1420110012345).", 400);
                }
            }
            // Vehicle + Driver ($isVehicleWithDriver):
            // - DOB mandatory (checked above)
            // - Driving License optional
            // - No 18+ restriction
            // - Driver service dates must be within vehicle rental period
            if ($isVehicleWithDriver) {
                $customsData = is_array($payload['customizations'] ?? null) 
                    ? $payload['customizations'] 
                    : (is_string($payload['customizations'] ?? null) ? json_decode($payload['customizations'], true) : []);
                if (!is_array($customsData)) $customsData = [];

                $driverStartDate = $payload['driver_pickup_date'] 
                    ?? ($payload['driver_start_date'] 
                    ?? ($payload['driver_fullday_start'] 
                    ?? ($customsData['driver_pickup_date'] ?? null)));

                $driverEndDate = $payload['driver_drop_date'] 
                    ?? ($payload['driver_end_date'] 
                    ?? ($payload['driver_fullday_end'] 
                    ?? ($customsData['driver_drop_date'] ?? null)));

                if (!empty($driverStartDate) && !empty($depDate)) {
                    $driverStartTs = strtotime($driverStartDate);
                    $depTs = strtotime($depDate);
                    $retTs = !empty($retDate) ? strtotime($retDate) : $depTs;
                    $periodFormatted = date('M j', $depTs) . '–' . date('M j', $retTs);

                    if ($driverStartTs && $depTs && $driverStartTs < $depTs) {
                        throw new BookingServiceException("Driver service date must be within the vehicle rental period ({$periodFormatted}).", 400);
                    }
                    if ($driverStartTs && $retTs && $driverStartTs > $retTs) {
                        throw new BookingServiceException("Driver service date must be within the vehicle rental period ({$periodFormatted}).", 400);
                    }
                }

                if (!empty($driverEndDate) && !empty($depDate)) {
                    $driverEndTs = strtotime($driverEndDate);
                    $depTs = strtotime($depDate);
                    $retTs = !empty($retDate) ? strtotime($retDate) : $depTs;
                    $periodFormatted = date('M j', $depTs) . '–' . date('M j', $retTs);

                    if ($driverEndTs && $depTs && $driverEndTs < $depTs) {
                        throw new BookingServiceException("Driver service date must be within the vehicle rental period ({$periodFormatted}).", 400);
                    }
                    if ($driverEndTs && $retTs && $driverEndTs > $retTs) {
                        throw new BookingServiceException("Driver service date must be within the vehicle rental period ({$periodFormatted}).", 400);
                    }
                }
            }
        }

        // 4. Begin Database Transaction
        $pdo->beginTransaction();

        try {
            // 5. Anti-Double-Booking & Shared Physical Inventory Check (Phase 3 & Phase 7)
            $allocatedPhysicalUnitId = null;
            $authoritativeVendorId = null;
            if (!empty($itemId) && function_exists('checkInventoryAvailability')) {
                $availRoomTypeId = null;
                $availReqRooms = 1;
                if ($serviceType === 'hotel') {
                    $customsData = is_array($payload['customizations'] ?? null) 
                        ? $payload['customizations'] 
                        : (is_string($payload['customizations'] ?? null) ? json_decode($payload['customizations'], true) : []);
                    if (!is_array($customsData)) $customsData = [];
                    $availRoomTypeId = $payload['room_type_id'] ?? ($customsData['selected_room_type'] ?? ($customsData['room_type_id'] ?? null));
                    $availReqRooms = max(1, intval($payload['num_rooms'] ?? ($customsData['num_rooms'] ?? ($payload['qty'] ?? 1))));
                }
                $avail = checkInventoryAvailability($pdo, $serviceType, $itemId, $depDate, $retDate, null, $availRoomTypeId, $availReqRooms);
                if (!$avail['available']) {
                    throw new BookingServiceException($avail['reason'] ?? "The selected item is already reserved or unavailable for the chosen dates.", 409, true);
                }
                $allocatedPhysicalUnitId = $avail['physical_unit_id'] ?? ($avail['allocated_unit']['id'] ?? null);
                $authoritativeVendorId = $avail['vendor_id'] ?? ($avail['allocated_unit']['vendor_id'] ?? null);
            }

            // Authoritative server-side vendor determination (Never trust client payload or query params)
            if (empty($authoritativeVendorId) && !empty($itemId)) {
                if ($serviceType === 'vehicle') {
                    $stmtV = $pdo->prepare("SELECT vendor_id FROM cars WHERE id = ?");
                    $stmtV->execute([$itemId]);
                    $vRow = $stmtV->fetch(PDO::FETCH_ASSOC);
                    if (!$vRow) {
                        $stmtV = $pdo->prepare("SELECT vendor_id FROM bikes WHERE id = ?");
                        $stmtV->execute([$itemId]);
                        $vRow = $stmtV->fetch(PDO::FETCH_ASSOC);
                    }
                    if ($vRow && !empty($vRow['vendor_id'])) {
                        $authoritativeVendorId = $vRow['vendor_id'];
                    } elseif (str_starts_with($itemId, 'lux-def-') || str_starts_with($itemId, 'car-def-') || str_starts_with($itemId, 'car-') || str_starts_with($itemId, 'car_')) {
                        // Curated platform self-drive car showcase: primary vehicle fleet vendor 'vendor-1'
                        $authoritativeVendorId = 'vendor-1';
                    } elseif (str_starts_with($itemId, 'bike-def-') || str_starts_with($itemId, 'bike-') || str_starts_with($itemId, 'bike_')) {
                        // Curated platform self-drive bike showcase: primary bike fleet vendor 'vendor-2'
                        $authoritativeVendorId = 'vendor-2';
                    }
                } elseif ($serviceType === 'hotel') {
                    $stmtH = $pdo->prepare("SELECT vendor_id FROM hotels WHERE id = ?");
                    $stmtH->execute([$itemId]);
                    $hRow = $stmtH->fetch(PDO::FETCH_ASSOC);
                    if ($hRow && !empty($hRow['vendor_id'])) {
                        $authoritativeVendorId = $hRow['vendor_id'];
                    } elseif (str_starts_with($itemId, 'hotel_') || str_starts_with($itemId, 'hotel-')) {
                        // Curated platform hotel partner
                        $authoritativeVendorId = 'vendor-3';
                    }
                } elseif ($serviceType === 'package') {
                    $stmtP = $pdo->prepare("SELECT vendor_id FROM packages WHERE id = ?");
                    $stmtP->execute([$itemId]);
                    $pRow = $stmtP->fetch(PDO::FETCH_ASSOC);
                    if ($pRow && !empty($pRow['vendor_id'])) {
                        $authoritativeVendorId = $pRow['vendor_id'];
                    } else {
                        $authoritativeVendorId = 'vendor-1';
                    }
                } elseif ($serviceType === 'flight') {
                    $cleanFId = preg_replace('/^(flight|fl)-?/i', '', $itemId);
                    $stmtF = $pdo->prepare("SELECT vendor_id FROM flights WHERE id = ? OR flight_number = ?");
                    $stmtF->execute([$cleanFId, $itemId]);
                    $fRow = $stmtF->fetch(PDO::FETCH_ASSOC);
                    if ($fRow && !empty($fRow['vendor_id'])) {
                        $authoritativeVendorId = $fRow['vendor_id'];
                    } elseif (!empty($payload['vendor_id'])) {
                        $authoritativeVendorId = $payload['vendor_id'];
                    } else {
                        $authoritativeVendorId = 'vendor-4';
                    }
                } elseif ($serviceType === 'activity' || $serviceType === 'sightseeing') {
                    $authoritativeVendorId = null;
                }
            }

            if (empty($authoritativeVendorId) && !empty($payload['vendor_id'])) {
                $authoritativeVendorId = $payload['vendor_id'];
            }

            // 6. Authoritative Pricing Calculation (Phase 5)
            $totalAmount = 0;
            $amountPaid = 0;
            $remainingAmount = 0;
            $driverReq = 0;
            $driverDays = 0;
            $driverCharge = 0;
            $driverEarning = 0;
            $driverPaymentStatus = 'Pending';
            $commercials = null;
            $itemName = $payload['item_name'] ?? 'Trip Booking';
            $ratePerDay = floatval($payload['price'] ?? 1500);
            $imageVal = $payload['vehicle_image'] ?? ($payload['image'] ?? ($payload['image_url'] ?? ''));

            // Authoritative driver_service_type determination (Rule 3)
            // Valid values: strictly PICKUP, DROP, FULL. NULL/empty = no driver job.
            $rawServiceType = strtoupper(trim($payload['driver_service_type'] ?? ($payload['extra_details']['driver_service_type'] ?? '')));
            $driverServiceType = null;
            if (in_array($rawServiceType, ['PICKUP', 'DROP', 'FULL'])) {
                $driverServiceType = $rawServiceType;
            } elseif (!empty($payload['driver_required']) && ($payload['driver_required'] == 1 || $payload['driver_required'] === '1' || $payload['driver_required'] === 'yes' || $payload['driver_required'] === true)) {
                // Backward-compatible fallback for legacy payloads if explicit driver_required passed without driver_service_type
                $driverServiceType = 'FULL';
            }

            $driverReq = $driverServiceType ? 1 : 0;
            if ($driverServiceType === 'PICKUP' || $driverServiceType === 'DROP') {
                $driverDays = 1;
                $driverCharge = 400;
                $driverEarning = 400;
            } elseif ($driverServiceType === 'FULL') {
                $driverDays = max(1, intval($payload['driver_days'] ?? $daysCount));
                $driverCharge = 800 * $driverDays;
                $driverEarning = 800 * $driverDays;
            } else {
                $driverDays = 0;
                $driverCharge = 0;
                $driverEarning = 0;
            }

            if ($isB2B) {
                // Authoritative B2B pricing calculation with rule precedence
                $b2bMode = strtoupper(trim($payload['b2b_mode'] ?? 'COMMISSION'));
                if (function_exists('calculateAuthoritativeB2BPrice')) {
                    $pricing = calculateAuthoritativeB2BPrice($pdo, $serviceType, $itemId, $daysCount, $qtyCount, $payload, $actor, $b2bMode);
                } else {
                    $pricing = [
                        'item_name' => $payload['item_name'] ?? 'Booking Item',
                        'item_image' => '',
                        'final_payable_amount' => floatval($payload['total_amount'] ?? 0)
                    ];
                }

                $itemName = $pricing['item_name'];
                if (empty($imageVal) && !empty($pricing['item_image'])) {
                    $imageVal = $pricing['item_image'];
                }

                $totalAmount = $pricing['final_payable_amount'];
                $amountPaid = $totalAmount;
                $remainingAmount = 0;
                $commercials = $pricing;
            } else {
                // Authoritative D2C calculation
                if ($serviceType === 'hotel') {
                    $hotelCalc = self::calculateAuthoritativeHotelPrice($pdo, $payload, $itemId, $depDate, $retDate);
                    $authoritativeTotal = $hotelCalc['authoritative_total'];

                    // Prevent total_amount manipulation: if client submitted total differs by > ₹10, reject manipulation
                    $clientSubmitted = floatval($payload['total_amount'] ?? ($payload['total_paid'] ?? 0));
                    if ($clientSubmitted > 0 && abs($clientSubmitted - $authoritativeTotal) > 10) {
                        throw new BookingServiceException(
                            "Authoritative hotel price validation failed: Server-calculated total is ₹" . number_format($authoritativeTotal) . ", but received ₹" . number_format($clientSubmitted) . ". Manipulated booking totals are strictly prevented.",
                            400
                        );
                    }

                    $totalAmount = $authoritativeTotal;
                    $walletAmountUsed = $hotelCalc['wallet_amount_used'];
                    $itemName = $hotelCalc['hotel']['name'] . ' - ' . $hotelCalc['room_type']['name'];
                    $imageVal = $hotelCalc['hotel']['image'] ?? ($hotelCalc['hotel']['image_url'] ?? $imageVal);
                    $driverReq = $hotelCalc['driver_required'];
                    $driverCharge = $hotelCalc['driver_charge'];
                    $driverServiceType = $hotelCalc['driver_service_type'];
                    if ($driverReq) {
                        $driverDays = ($driverServiceType === 'entire_stay' || $driverServiceType === 'FULL') ? $hotelCalc['nights'] : 1;
                        $driverEarning = $driverCharge;
                    }

                    // Authoritative metadata to persist in customizations
                    $customizationsData = [
                        'hotel_id' => $itemId,
                        'hotel_name' => $hotelCalc['hotel']['name'],
                        'room_type_id' => $hotelCalc['room_type']['id'],
                        'selected_room_type' => $hotelCalc['room_type']['id'],
                        'room_type_name' => $hotelCalc['room_type']['name'],
                        'selected_room_name' => $hotelCalc['room_type']['name'],
                        'rate_plan_id' => $hotelCalc['rate_plan_id'],
                        'meal_plan' => $hotelCalc['meal_plan'],
                        'cancellation_policy' => $hotelCalc['cancellation_policy'],
                        'check_in_date' => $depDate,
                        'check_out_date' => $retDate,
                        'check_in_time' => $payload['checkin_time'] ?? ($hotelCalc['hotel']['checkin_time'] ?? '02:00 PM'),
                        'check_out_time' => $payload['checkout_time'] ?? ($hotelCalc['hotel']['checkout_time'] ?? '11:00 AM'),
                        'nights' => $hotelCalc['nights'],
                        'num_rooms' => $hotelCalc['num_rooms'],
                        'adults' => $hotelCalc['adults'],
                        'children' => $hotelCalc['children'],
                        'num_guests' => $hotelCalc['num_guests'],
                        'driver_required' => $driverReq,
                        'driver_service' => $driverServiceType,
                        'driver_charge' => $driverCharge,
                        'hotel_location' => $hotelCalc['hotel']['area'] ?? ($hotelCalc['hotel']['location'] ?? 'Goa'),
                        'authoritative_price_breakdown' => [
                            'base_room_rate' => $hotelCalc['base_rate'],
                            'weekend_room_rate' => $hotelCalc['weekend_rate'],
                            'meal_surcharge_per_night' => $hotelCalc['meal_surcharge_night'],
                            'room_nights_subtotal' => $hotelCalc['room_nights_subtotal'],
                            'extra_adult_charge' => $hotelCalc['extra_adult_charge'],
                            'extra_child_charge' => $hotelCalc['extra_child_charge'],
                            'markup' => $hotelCalc['markup_amount'],
                            'room_total_with_markup' => $hotelCalc['room_total_with_markup'],
                            'gst' => $hotelCalc['gst'],
                            'platform_fee' => $hotelCalc['platform_fee'],
                            'driver_charge' => $driverCharge,
                            'total_amount' => $authoritativeTotal,
                            'wallet_amount_used' => $walletAmountUsed,
                            'final_payable' => $hotelCalc['final_payable']
                        ]
                    ];
                    $payload['customizations'] = $customizationsData;
                    $payload['hotel_name'] = $hotelCalc['hotel']['name'];
                    $amountPaid = floatval($payload['amount_paid'] ?? ($payload['total_paid'] ?? $totalAmount));
                    $remainingAmount = max(0, $totalAmount - $amountPaid);
                } else {
                    // Authoritative vehicle calculation & manipulation check
                    if ($serviceType === 'vehicle' && !empty($itemId)) {
                        $stmtVeh = $pdo->prepare("SELECT price FROM cars WHERE id = ?");
                        $stmtVeh->execute([$itemId]);
                        $vehRow = $stmtVeh->fetch(PDO::FETCH_ASSOC);
                        if (!$vehRow) {
                            $stmtVeh = $pdo->prepare("SELECT price FROM bikes WHERE id = ?");
                            $stmtVeh->execute([$itemId]);
                            $vehRow = $stmtVeh->fetch(PDO::FETCH_ASSOC);
                        }
                        if ($vehRow && isset($vehRow['price'])) {
                            $ratePerDay = floatval($vehRow['price']);
                            $authVehicleSubtotal = $ratePerDay * $daysCount;
                            $tierDiscount = floatval($payload['tier_discount_applied'] ?? 0);
                            $walletUsed = floatval($payload['wallet_amount_used'] ?? 0);

                            // Authoritative calculations for standard vehicle booking modal (18% GST + ₹250 admin fee)
                            $authGst = round($authVehicleSubtotal * 0.18);
                            $authFee = 250;
                            $authModalTotal = $authVehicleSubtotal + $authGst + $authFee + $driverCharge - $tierDiscount - $walletUsed;

                            // Authoritative total for simple-price vehicle bookings (no GST/fee additions)
                            $authSimpleTotal = $authVehicleSubtotal + $driverCharge - $tierDiscount - $walletUsed;

                            $clientSubmitted = floatval($payload['total_amount'] ?? ($payload['total_paid'] ?? 0));

                            $isMatchModal = ($clientSubmitted > 0 && abs($clientSubmitted - $authModalTotal) <= 10);
                            $isMatchSimple = ($clientSubmitted > 0 && abs($clientSubmitted - $authSimpleTotal) <= 10);

                            if ($clientSubmitted > 0 && !$isMatchModal && !$isMatchSimple) {
                                throw new BookingServiceException(
                                    "Price validation failed: Authoritative total is ₹" . number_format($authModalTotal) . " but received ₹" . number_format($clientSubmitted) . ". Manipulated booking totals are strictly prevented.",
                                    400
                                );
                            }

                            $totalAmount = $isMatchModal ? $authModalTotal : $authSimpleTotal;
                        } else {
                            $totalAmount = floatval($payload['total_amount'] ?? ($payload['total_paid'] ?? 0));
                        }
                    } else {
                        $totalAmount = floatval($payload['total_amount'] ?? ($payload['total_paid'] ?? 0));
                    }
                    $amountPaid = floatval($payload['amount_paid'] ?? ($payload['total_paid'] ?? $totalAmount));
                    $remainingAmount = max(0, $totalAmount - $amountPaid);

                    // Fetch image if not present
                    if (empty($imageVal) && !empty($itemId)) {
                        $stmtImg = $pdo->prepare("SELECT image FROM cars WHERE id = ?");
                        $stmtImg->execute([$itemId]);
                        $imgRow = $stmtImg->fetch(PDO::FETCH_ASSOC);
                        if (!$imgRow) {
                            $stmtImgB = $pdo->prepare("SELECT image FROM bikes WHERE id = ?");
                            $stmtImgB->execute([$itemId]);
                            $imgRow = $stmtImgB->fetch(PDO::FETCH_ASSOC);
                        }
                        if (!$imgRow) {
                            $stmtImgH = $pdo->prepare("SELECT image FROM hotels WHERE id = ?");
                            $stmtImgH->execute([$itemId]);
                            $imgRow = $stmtImgH->fetch(PDO::FETCH_ASSOC);
                        }
                        if (!$imgRow) {
                            $stmtImgA = $pdo->prepare("SELECT image_url, image FROM add_ons WHERE id = ?");
                            $stmtImgA->execute([$itemId]);
                            $actRow = $stmtImgA->fetch(PDO::FETCH_ASSOC);
                            if ($actRow) {
                                $imgRow = ['image' => !empty($actRow['image_url']) ? $actRow['image_url'] : ($actRow['image'] ?? '')];
                            }
                        }
                        if ($imgRow && !empty($imgRow['image'])) {
                            $imageVal = $imgRow['image'];
                        }
                    }
                }
            }

            // 7. Customer Identity & Permanent DOB Management
            $custDob = null;
            if (!empty($last10)) {
                try {
                    $chkCust = $pdo->prepare("SELECT id, name, phone, email, date_of_birth FROM users WHERE (phone != '' AND (phone LIKE ? OR phone LIKE ?)) OR (email != '' AND LOWER(email) = ?) LIMIT 1");
                    $chkCust->execute(["%$last10", "%$rawPhone", $custEmail]);
                    $existingCust = $chkCust->fetch(PDO::FETCH_ASSOC);

                    if ($existingCust) {
                        if (!empty($existingCust['date_of_birth'])) {
                            // Retain existing stored DOB - NEVER overwrite
                            $custDob = $existingCust['date_of_birth'];
                        } elseif (!empty($rawDob)) {
                            $custDob = $rawDob;
                            $updCust = $pdo->prepare("UPDATE users SET date_of_birth = ? WHERE id = ?");
                            $updCust->execute([$custDob, $existingCust['id']]);
                        }
                    } else {
                        // Create new customer profile with mandatory DOB
                        $custDob = !empty($rawDob) ? $rawDob : null;
                        $newCustId = 'c_' . $last10;
                        $chkExistingId = $pdo->prepare("SELECT id FROM users WHERE id = ?");
                        $chkExistingId->execute([$newCustId]);
                        if (!$chkExistingId->fetch()) {
                            $insCust = $pdo->prepare("INSERT INTO users (id, username, name, email, phone, role, status, date_of_birth, created_at) VALUES (?, ?, ?, ?, ?, 'customer', 'active', ?, ?)");
                            $insCust->execute([$newCustId, $rawPhone, $custName, $custEmail, $rawPhone, $custDob, date('Y-m-d H:i:s')]);
                        }
                    }
                } catch (Exception $ce) {}

                if (empty($custDob) && !empty($rawDob)) {
                    $custDob = $rawDob;
                }
            }

            // 8. Generate Authoritative Master Booking ID
            $bookingId = !empty($payload['id']) ? $payload['id'] : ($isB2B ? ('TG-B2B-' . strtoupper(substr(uniqid(), -6))) : ('TG-' . rand(100000, 999999)));

            // 9a. Server-Side Tier Discount Enforcement (D2C only)
            $tierDiscountApplied = 0.00;
            $customerTierAtBooking = 'New Member';
            if (!$isB2B && function_exists('calculateCustomerTiers')) {
                try {
                    $tierData = calculateCustomerTiers($pdo, $rawPhone);
                    $resolvedTier = $tierData['resolved_tier'] ?? 'New Member';
                    $customerTierAtBooking = $resolvedTier;
                    // Gold: ₹500 flat discount on bookings > ₹5,000
                    if ($resolvedTier === 'Gold' && $totalAmount > 5000) {
                        $tierDiscountApplied = 500.00;
                    }
                    // Platinum: ₹1,000 flat discount on bookings > ₹10,000
                    // (only if upgrade not requested — mutually exclusive)
                    elseif ($resolvedTier === 'Platinum' && $totalAmount > 10000) {
                        $customizations = $payload['customizations'] ?? [];
                        if (is_string($customizations)) $customizations = json_decode($customizations, true) ?? [];
                        $upgradeRequested = !empty($customizations['platinum_upgrade_requested']);
                        if (!$upgradeRequested) {
                            $tierDiscountApplied = 1000.00;
                        }
                    }
                    $totalAmount = max(0, $totalAmount - $tierDiscountApplied);
                } catch (Exception $tierEx) {
                    $tierDiscountApplied = 0.00;
                }
            }

            // 9b. Customer Wallet Deduction (D2C - strictly 10% of post-tier-discount total)
            $walletAmountUsed = max(0, round(floatval($payload['wallet_amount_used'] ?? 0), 2));
            $maxAllowedWalletBenefit = round($totalAmount * 0.10, 2);
            if ($walletAmountUsed > $maxAllowedWalletBenefit) {
                $walletAmountUsed = $maxAllowedWalletBenefit;
            }

            if (!$isB2B) {
                $remainingAmount = max(0, round($totalAmount - ($amountPaid + $walletAmountUsed), 2));
                $totalPaid = round($amountPaid + $walletAmountUsed, 2);
            } else {
                $totalPaid = $amountPaid;
            }

            $cashbackEarned = 0;
            $cashbackStatus = 'Pending';
            if ($walletAmountUsed > 0 && function_exists('deductCustomerWallet')) {
                deductCustomerWallet($pdo, $rawPhone, 'c_' . $last10, $walletAmountUsed, $bookingId);
            }
            if (!$isB2B) {
                $eligiblePaidAmt = max(0, $totalAmount - $walletAmountUsed);
                $cashbackEarned = round($eligiblePaidAmt * 0.10, 2);
            }

            // 10. Insert Authoritative Master Booking
            $initStatus = $payload['status'] ?? 'Pending';
            $paymentStatus = $payload['payment_status'] ?? 'Paid';
            $paymentMethod = $payload['payment_method'] ?? ($payload['payment_mode'] ?? ($isB2B ? 'B2B Account / Cash' : 'Cash'));
            $tenantId = $payload['tenant_id'] ?? ($actor['tenant_id'] ?? 'admin');

            $sqlMaster = "INSERT INTO bookings (
                id, parent_booking_id, name, phone, email, license, pickup_loc, pickup_date, pickup_time, drop_date, drop_time,
                departure_date, return_date, check_in_date, check_out_date, duration, item_id, item_name,
                booking_days, total_amount, amount_paid, remaining_amount, total_paid, status, payment_status,
                customizations, created_at, payment_method, admin_id, driver_required, driver_charge,
                driver_days, driver_earning, driver_payment_status, image, vehicle_image, date_of_birth,
                type, wallet_amount_used, cashback_earned, cashback_status,
                tier_discount_applied, customer_tier_at_booking,
                booking_channel, b2b_mode, b2b_partner_id, b2b_partner_name,
                b2b_original_price, b2b_base_price, b2b_tax_amount,
                b2b_commission_percentage, b2b_commission_amount, b2b_commission_status,
                b2b_net_discount_percentage, b2b_net_price, b2b_pricing_rule_id, idempotency_key,
                vendor_id, physical_unit_id, driver_service_type, hotel_name, package_type, package_name,
                vendor_base_price, wow_markup_type, wow_markup_value, wow_markup_amount,
                b2b_price, b2b_markup_type, b2b_markup_value, b2b_markup_amount,
                customer_price, pricing_snapshot_json,
                customer_payment, wow_goa_platform_fee, vendor_service_amount,
                payment_reference, customer_payment_utr, payment_screenshot, payment_verification_status,
                vendor_payout_status, cancellation_policy_snapshot
            ) VALUES (
                ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?
            )";

            $isGenuineB2B = $isB2B && !empty($actor) && in_array(strtolower($actor['role'] ?? ''), ['b2b', 'agent']);
            $finalChannel = $isGenuineB2B ? 'B2B' : 'D2C';
            $authoritativeB2BPartnerId = $isGenuineB2B ? ($actor['id'] ?? null) : null;
            $authoritativeB2BPartnerName = $isGenuineB2B ? ($actor['company_name'] ?? ($actor['name'] ?? null)) : null;

            // Compute immutable snapshot values
            if ($isGenuineB2B && !empty($commercials)) {
                $snapVendorBase = floatval($commercials['vendor_base_price'] ?? ($commercials['base_price'] ?? 0));
                $snapWowType = strtolower($commercials['wow_markup_type'] ?? 'percentage');
                $snapWowVal = floatval($commercials['wow_markup_value'] ?? 0);
                $snapWowAmt = floatval($commercials['wow_markup_amount'] ?? 0);
                $snapB2BPrice = floatval($commercials['b2b_price'] ?? ($snapVendorBase + $snapWowAmt));
                $snapB2BType = strtolower($commercials['b2b_markup_type'] ?? 'percentage');
                $snapB2BVal = floatval($commercials['b2b_markup_value'] ?? 0);
                $snapB2BAmt = floatval($commercials['b2b_markup_amount'] ?? 0);
                $snapCustPrice = floatval($commercials['customer_price'] ?? $totalAmount);
                $snapJson = json_encode($commercials);
            } else {
                $snapVendorBase = floatval(max(0, $totalAmount - ($markupAmount ?? 0)));
                $snapWowType = 'percentage';
                $snapWowVal = 0.00;
                $snapWowAmt = floatval($markupAmount ?? 0);
                $snapB2BPrice = floatval($totalAmount);
                $snapB2BType = 'fixed';
                $snapB2BVal = 0.00;
                $snapB2BAmt = 0.00;
                $snapCustPrice = floatval($totalAmount);
                $snapJson = json_encode([
                    'vendor_base_price' => $snapVendorBase,
                    'wow_markup_amount' => $snapWowAmt,
                    'customer_price' => $snapCustPrice,
                    'channel' => 'D2C'
                ]);
            }

            // Compute Static QR financial split & payment verification status
            $snapCustPayment = floatval($totalAmount);
            $snapWowFee = round($snapCustPayment * 0.10, 2);
            $snapVendorServiceAmt = round($snapCustPayment * 0.90, 2);
            $paymentRef = $payload['payment_reference'] ?? ($payload['utr'] ?? ($payload['payment_utr'] ?? null));
            $paymentProof = $payload['payment_screenshot'] ?? ($payload['payment_proof'] ?? null);

            $isStaticQr = (stripos($paymentMethod, 'qr') !== false || stripos($paymentMethod, 'upi') !== false || stripos($paymentMethod, 'static') !== false);
            $paymentVerifStatus = $payload['payment_verification_status'] ?? ($isStaticQr ? 'Pending Verification' : 'Approved');
            if ($isStaticQr && empty($payload['status'])) {
                $initStatus = 'Pending';
                $paymentStatus = 'Pending Verification';
            }
            $vendorPayoutStatus = $payload['vendor_payout_status'] ?? 'Pending';

            // Vendor cancellation policy snapshot at booking time
            $policySnapshot = self::getVendorCancellationPolicy($pdo, $authoritativeVendorId, $serviceType);
            if (!$policySnapshot && !empty($authoritativeVendorId)) {
                $policySnapshot = self::ensureVendorDefaultPolicy($pdo, $authoritativeVendorId, $serviceType);
            }
            $cancellationPolicySnapshotJson = $policySnapshot ? json_encode($policySnapshot) : null;

            $stmtMaster = $pdo->prepare($sqlMaster);
            $stmtMaster->execute([
                $bookingId,
                $custName,
                $rawPhone,
                $custEmail,
                $rawLicense,
                $payload['pickup_loc'] ?? ($payload['pickup_location'] ?? 'Goa'),
                $depDate,
                $payload['pickup_time'] ?? '10:00 AM',
                $retDate,
                $payload['drop_time'] ?? '10:00 AM',
                $depDate,
                $retDate,
                $depDate,
                $retDate,
                $durationVal,
                $itemId,
                $itemName,
                $daysCount,
                $totalAmount,
                $amountPaid,
                $remainingAmount,
                $totalPaid,
                $initStatus,
                $paymentStatus,
                is_array($payload['customizations'] ?? null) ? json_encode($payload['customizations']) : ($payload['customizations'] ?? null),
                date('Y-m-d H:i:s'),
                $paymentMethod,
                $tenantId,
                $driverReq,
                $driverCharge,
                $driverDays,
                $driverEarning,
                $driverPaymentStatus,
                $imageVal,
                $imageVal,
                $custDob,
                $serviceType,
                $walletAmountUsed,
                $cashbackEarned,
                $cashbackStatus,
                $tierDiscountApplied,
                $customerTierAtBooking,
                $finalChannel,
                $isGenuineB2B ? ($commercials['b2b_mode'] ?? null) : null,
                $authoritativeB2BPartnerId,
                $authoritativeB2BPartnerName,
                $commercials['original_reference_price'] ?? null,
                $commercials['base_price'] ?? null,
                $commercials['tax_amount'] ?? null,
                $commercials['commission_percent'] ?? null,
                $commercials['commission_amount'] ?? null,
                $commercials ? 'Approved' : null,
                $commercials['net_discount_percent'] ?? null,
                $commercials['net_price'] ?? null,
                $commercials['pricing_rule_id'] ?? null,
                $idempotencyKey ?: null,
                $authoritativeVendorId,
                $allocatedPhysicalUnitId,
                $driverServiceType,
                $payload['hotel_name'] ?? null,
                $payload['package_type'] ?? null,
                $payload['package_name'] ?? $itemName,
                // Pricing snapshot fields
                $snapVendorBase,
                $snapWowType,
                $snapWowVal,
                $snapWowAmt,
                $snapB2BPrice,
                $snapB2BType,
                $snapB2BVal,
                $snapB2BAmt,
                $snapCustPrice,
                $snapJson,
                // Static QR & financial split fields
                $snapCustPayment,
                $snapWowFee,
                $snapVendorServiceAmt,
                $paymentRef,
                $paymentRef,
                $paymentProof,
                $paymentVerifStatus,
                $vendorPayoutStatus,
                $cancellationPolicySnapshotJson
            ]);

            // 11. Master-Child Booking Creation for Package Bookings (Phase 6)
            $children = [];
            if ($serviceType === 'package') {
                $children = self::createPackageChildBookings($pdo, $bookingId, $itemId, $payload, $depDate, $retDate, $daysCount, $custName, $rawPhone, $custEmail, $tenantId);
            }

            // 12. Commit Transaction
            $pdo->commit();

            // 13. Central Notification Dispatch (Phase 8)
            try {
                if (function_exists('createAuthoritativeNotification')) {
                    $custRecipient = !empty($last10) ? ('c_' . $last10) : $rawPhone;
                    createAuthoritativeNotification(
                        $pdo,
                        $custRecipient,
                        'customer',
                        'booking_confirmed',
                        'Booking Confirmed #' . $bookingId,
                        "Your booking for {$itemName} has been confirmed.",
                        'booking',
                        $bookingId
                    );

                    if (!empty($authoritativeVendorId)) {
                        // Determine correct vendor role based on service type
                        $vendorRole = 'vendor';
                        $notifType = 'vehicle_booking';
                        if ($serviceType === 'hotel') {
                            $vendorRole = 'hotel_vendor';
                            $notifType = 'hotel_booking';
                        } elseif ($serviceType === 'flight') {
                            $vendorRole = 'flight_vendor';
                            $notifType = 'flight_booking';
                        }
                        
                        createAuthoritativeNotification(
                            $pdo,
                            $authoritativeVendorId,
                            $vendorRole,
                            $notifType,
                            'New Booking Received #' . $bookingId,
                            "New reservation received for {$itemName}" . ($allocatedPhysicalUnitId ? " (Unit: {$allocatedPhysicalUnitId})" : "") . ".",
                            'booking',
                            $bookingId
                        );

                        // If authoritative vendor is seeded car or bike fleet entity, also dispatch to primary vehicle vendor console user u-4
                        if ($authoritativeVendorId === 'vendor-1' || $authoritativeVendorId === 'vendor-2') {
                            createAuthoritativeNotification(
                                $pdo,
                                'u-4',
                                'vendor',
                                $notifType,
                                'New Booking Received #' . $bookingId,
                                "New reservation received for {$itemName}" . ($allocatedPhysicalUnitId ? " (Unit: {$allocatedPhysicalUnitId})" : "") . ".",
                                'booking',
                                $bookingId
                            );
                        }
                        // If authoritative vendor is seeded hotel entity, also dispatch to primary hotel console user u-5
                        if ($authoritativeVendorId === 'vendor-3') {
                            createAuthoritativeNotification(
                                $pdo,
                                'u-5',
                                'hotel_vendor',
                                $notifType,
                                'New Booking Received #' . $bookingId,
                                "New reservation received for {$itemName}.",
                                'booking',
                                $bookingId
                            );
                        }
                        // If authoritative vendor is seeded flight entity, also dispatch to primary flight console user u-6
                        if ($authoritativeVendorId === 'vendor-4') {
                            createAuthoritativeNotification(
                                $pdo,
                                'u-6',
                                'flight_vendor',
                                $notifType,
                                'New Flight Booking Received #' . $bookingId,
                                "New reservation received for {$itemName}.",
                                'booking',
                                $bookingId
                            );
                        }
                    }

                    if ($isB2B && !empty($actor['id'])) {
                        createAuthoritativeNotification(
                            $pdo,
                            $actor['id'],
                            'b2b',
                            'b2b_booking_confirmed',
                            'B2B Booking Confirmed #' . $bookingId,
                            "B2B reservation for {$itemName} confirmed.",
                            'booking',
                            $bookingId,
                            $actor['id']
                        );
                    }

                    createAuthoritativeNotification(
                        $pdo,
                        'admin',
                        'admin',
                        'booking_created',
                        'New ' . $channel . ' Booking #' . $bookingId,
                        "{$channel} booking created by {$custName} for {$itemName}.",
                        'booking',
                        $bookingId
                    );
                }
            } catch (Exception $ne) {}

            // 13. Fetch Final Created Master Booking Record
            $stmtFetch = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
            $stmtFetch->execute([$bookingId]);
            $createdRecord = $stmtFetch->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'booking_id' => $bookingId,
                'id' => $bookingId,
                'message' => $isB2B ? 'B2B booking confirmed successfully.' : 'Booking created successfully.',
                'booking' => $createdRecord,
                'data' => $createdRecord,
                'children' => $children,
                'commercials' => $commercials
            ];

        } catch (BookingServiceException $bse) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $bse;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new BookingServiceException("Booking failed: " . $e->getMessage(), 400);
        }
    }

    /**
     * Create child operational bookings for a Master Package booking (Phase 6).
     * Allocates hotel room, vehicle rental, and driver transfer under the same transaction.
     */
    private static function createPackageChildBookings(
        PDO $pdo,
        string $masterBookingId,
        string $packageId,
        array $payload,
        string $pickupDate,
        string $dropDate,
        int $daysCount,
        string $custName,
        string $custPhone,
        string $custEmail,
        string $tenantId
    ): array {
        $children = [];

        // Fetch package details
        $stmtPkg = $pdo->prepare("SELECT * FROM packages WHERE id = ?");
        $stmtPkg->execute([$packageId]);
        $pkg = $stmtPkg->fetch(PDO::FETCH_ASSOC);

        $hotelName = $payload['hotel_name'] ?? ($pkg['hotel_included'] ?? '');
        $carName = $payload['car_name'] ?? ($pkg['car_included'] ?? '');
        $pickupDropInc = $payload['pickup_drop_included'] ?? ($pkg['pickup_drop_included'] ?? '');
        $driverReq = (!empty($payload['driver_required']) || !empty($pickupDropInc));

        // 1. Hotel Child Allocation (Only for packages with overnight stay >= 1 night)
        $stayNights = (!empty($pickupDate) && !empty($dropDate)) ? max(0, (int)round((strtotime($dropDate) - strtotime($pickupDate)) / 86400)) : 0;
        if (!empty($hotelName) && $stayNights > 0 && $pickupDate !== $dropDate) {
            // Find hotel in inventory
            $stmtH = $pdo->prepare("SELECT id, name, is_available, blocked_dates FROM hotels WHERE name = ? OR id = ? OR name LIKE ? LIMIT 1");
            $stmtH->execute([$hotelName, $hotelName, "%$hotelName%"]);
            $hotel = $stmtH->fetch(PDO::FETCH_ASSOC);
            $hotelId = $hotel['id'] ?? ('hotel-pkg-' . substr(md5($hotelName), 0, 8));

            // Availability validation for hotel component
            if ($hotel && function_exists('checkInventoryAvailability')) {
                $hAvail = checkInventoryAvailability($pdo, 'hotel', $hotel['id'], $pickupDate, $dropDate);
                if (!$hAvail['available']) {
                    throw new BookingServiceException("Package Hotel Allocation Failed: " . ($hAvail['reason'] ?? "Hotel unavailable."), 409, true);
                }
            }

            $childHotelId = 'BK-H-' . strtoupper(substr(uniqid(), -6));
            $hChildVendorId = $hAvail['vendor_id'] ?? ($hotel['vendor_id'] ?? null);
            $stmtInsH = $pdo->prepare("INSERT INTO bookings (
                id, parent_booking_id, name, phone, email, item_id, item_name, type,
                pickup_date, drop_date, check_in_date, check_out_date, booking_days,
                status, payment_status, total_amount, amount_paid, created_at, admin_id,
                vendor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'hotel', ?, ?, ?, ?, ?, ?, 'Paid', 0, 0, ?, ?, ?)");
            $stmtInsH->execute([
                $childHotelId,
                $masterBookingId,
                $custName,
                $custPhone,
                $custEmail,
                $hotelId,
                $hotel['name'] ?? $hotelName,
                $pickupDate,
                $dropDate,
                $pickupDate,
                $dropDate,
                $stayNights,
                $initStatus,
                date('Y-m-d H:i:s'),
                $tenantId,
                $hChildVendorId
            ]);
            $children['hotel'] = $childHotelId;
        }

        // 2. Vehicle Child Allocation
        if (!empty($carName)) {
            // Find car in inventory
            $stmtC = $pdo->prepare("SELECT id, name, is_available, vendor_id FROM cars WHERE name = ? OR id = ? OR name LIKE ? LIMIT 1");
            $stmtC->execute([$carName, $carName, "%$carName%"]);
            $car = $stmtC->fetch(PDO::FETCH_ASSOC);
            $carId = $car['id'] ?? ('car-pkg-' . substr(md5($carName), 0, 8));

            // Availability validation for vehicle component
            $vChildUnitId = null;
            $vChildVendorId = $car['vendor_id'] ?? null;
            if ($car && function_exists('checkInventoryAvailability')) {
                $vAvail = checkInventoryAvailability($pdo, 'car', $car['id'], $pickupDate, $dropDate);
                if (!$vAvail['available']) {
                    throw new BookingServiceException("Package Vehicle Allocation Failed: " . ($vAvail['reason'] ?? "Vehicle unavailable."), 409, true);
                }
                $vChildUnitId = $vAvail['physical_unit_id'] ?? null;
                $vChildVendorId = $vAvail['vendor_id'] ?? ($car['vendor_id'] ?? null);
            }

            $childVehId = 'BK-V-' . strtoupper(substr(uniqid(), -6));
            $stmtInsV = $pdo->prepare("INSERT INTO bookings (
                id, parent_booking_id, name, phone, email, item_id, item_name, type,
                pickup_date, drop_date, departure_date, return_date, booking_days,
                status, payment_status, total_amount, amount_paid, created_at, admin_id,
                vendor_id, physical_unit_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'car', ?, ?, ?, ?, ?, ?, 'Paid', 0, 0, ?, ?, ?, ?)");
            $stmtInsV->execute([
                $childVehId,
                $masterBookingId,
                $custName,
                $custPhone,
                $custEmail,
                $carId,
                $car['name'] ?? $carName,
                $pickupDate,
                $dropDate,
                $pickupDate,
                $dropDate,
                $daysCount,
                $initStatus,
                date('Y-m-d H:i:s'),
                $tenantId,
                $vChildVendorId,
                $vChildUnitId
            ]);
            $children['vehicle'] = $childVehId;
        }

        // 3. Driver Child Allocation
        if ($driverReq) {
            $childDriverId = 'BK-D-' . strtoupper(substr(uniqid(), -6));
            $driverDays = $daysCount;
            // Driver standard rates: ₹800/day (₹400 pickup + ₹400 drop)
            $driverCharge = 800 * $driverDays;
            $stmtInsD = $pdo->prepare("INSERT INTO bookings (
                id, parent_booking_id, name, phone, email, item_id, item_name, type,
                pickup_date, drop_date, driver_required, driver_days, driver_charge,
                driver_earning, driver_job_status, driver_payment_status,
                status, payment_status, total_amount, amount_paid, created_at, admin_id
            ) VALUES (?, ?, ?, ?, ?, 'driver-transfer', 'Airport Transfer & Sightseeing Driver', 'driver', ?, ?, 1, ?, ?, ?, 'Pending', 'Pending', ?, 'Paid', 0, 0, ?, ?)");
            $stmtInsD->execute([
                $childDriverId,
                $masterBookingId,
                $custName,
                $custPhone,
                $custEmail,
                $pickupDate,
                $dropDate,
                $driverDays,
                $driverCharge,
                $driverCharge,
                $initStatus,
                date('Y-m-d H:i:s'),
                $tenantId
            ]);
            $children['driver'] = $childDriverId;
        }

        return $children;
    }

    /**
     * Authoritatively recalculate hotel booking price from database records.
     * Enforces date-specific pricing, calendar overrides, weekend pricing, meal plans (EP/CP/MAP/AP),
     * extra guests (adults/children), markups, 18% GST, flat ₹250 platform fee, chauffeur, and 10% wallet benefit limit.
     */
    public static function calculateAuthoritativeHotelPrice(PDO $pdo, array $payload, string $hotelId, string $depDate, string $retDate): array {
        $stmtH = $pdo->prepare("SELECT * FROM hotels WHERE id = ?");
        $stmtH->execute([$hotelId]);
        $hotel = $stmtH->fetch(PDO::FETCH_ASSOC);
        if (!$hotel) {
            throw new BookingServiceException("The requested hotel property does not exist.", 404);
        }

        // Customizations payload extraction
        $customs = is_array($payload['customizations'] ?? null) 
            ? $payload['customizations'] 
            : (is_string($payload['customizations'] ?? null) ? json_decode($payload['customizations'], true) : []);
        if (!is_array($customs)) $customs = [];

        // 1. Resolve room type
        $roomTypeId = $payload['room_type_id'] ?? ($customs['selected_room_type'] ?? ($customs['room_type_id'] ?? ''));
        $roomTypeName = $payload['room_type'] ?? ($customs['selected_room_name'] ?? '');
        $rt = null;
        if (!empty($roomTypeId)) {
            $stmtRt = $pdo->prepare("SELECT * FROM hotel_room_types WHERE id = ? AND hotel_id = ?");
            $stmtRt->execute([$roomTypeId, $hotelId]);
            $rt = $stmtRt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$rt && !empty($roomTypeName)) {
            $stmtRt = $pdo->prepare("SELECT * FROM hotel_room_types WHERE hotel_id = ? AND name = ? LIMIT 1");
            $stmtRt->execute([$hotelId, $roomTypeName]);
            $rt = $stmtRt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$rt) {
            // Fallback to first active room type for this hotel
            $stmtRt = $pdo->prepare("SELECT * FROM hotel_room_types WHERE hotel_id = ? AND status = 'Active' ORDER BY id ASC LIMIT 1");
            $stmtRt->execute([$hotelId]);
            $rt = $stmtRt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$rt) {
            // If still no room types in DB for this hotel, construct base room from hotel row
            $rt = [
                'id' => 'rt_' . $hotelId . '_std',
                'hotel_id' => $hotelId,
                'name' => 'Standard Deluxe Room',
                'base_price' => floatval($hotel['price'] ?: 4500),
                'selling_price' => floatval($hotel['price'] ?: 4500),
                'weekend_price' => floatval($hotel['price'] ?: 4500),
                'extra_adult_charge' => 0,
                'extra_child_charge' => 0,
                'max_occupancy' => 3,
                'base_occupancy' => 2
            ];
        }

        $roomTypeId = $rt['id'];
        $roomTypeName = $rt['name'];

        // 2. Resolve meal plan & rate plan
        $ratePlanId = $payload['rate_plan_id'] ?? ($customs['rate_plan_id'] ?? '');
        $mealPlan = strtoupper(trim($payload['meal_plan'] ?? ($customs['meal_plan'] ?? 'EP')));
        if (!in_array($mealPlan, ['EP', 'CP', 'MAP', 'AP'])) {
            $mealPlan = 'EP';
        }

        $rp = null;
        if (!empty($ratePlanId)) {
            $stmtRp = $pdo->prepare("SELECT * FROM hotel_rate_plans WHERE id = ?");
            $stmtRp->execute([$ratePlanId]);
            $rp = $stmtRp->fetch(PDO::FETCH_ASSOC);
        }
        if (!$rp) {
            $stmtRp = $pdo->prepare("SELECT * FROM hotel_rate_plans WHERE hotel_id = ? AND room_type_id = ? AND UPPER(meal_plan) = ? AND is_active = 1 LIMIT 1");
            $stmtRp->execute([$hotelId, $roomTypeId, $mealPlan]);
            $rp = $stmtRp->fetch(PDO::FETCH_ASSOC);
        }

        // Pricing rules
        $baseRoomRate = floatval($rt['selling_price'] ?: ($rt['price'] ?: ($rt['base_price'] ?: ($hotel['price'] ?: 4500))));
        $weekendRoomRate = floatval($rt['weekend_price'] ?: $baseRoomRate);
        $extraAdultRate = floatval($rt['extra_adult_charge'] ?? 0);
        $extraChildRate = floatval($rt['extra_child_charge'] ?? 0);
        $cancellationPolicy = $rp['cancellation_policy'] ?? ($rt['cancellation_policy'] ?? 'Free cancellation up to 48 hours before check-in');

        // Standard Meal Plan surcharges if not already a dedicated rate plan
        $mealPlanSurcharges = [
            'EP' => 0,
            'CP' => 500,
            'MAP' => 1400,
            'AP' => 2200
        ];
        $mealSurchargePerNight = $mealPlanSurcharges[$mealPlan] ?? 0;

        if ($rp) {
            if (!empty($rp['base_price']) && floatval($rp['base_price']) > 0) {
                $baseRoomRate = floatval($rp['base_price']);
                $mealSurchargePerNight = 0; // price already includes meal plan
            }
            if (!empty($rp['weekend_price']) && floatval($rp['weekend_price']) > 0) {
                $weekendRoomRate = floatval($rp['weekend_price']);
            }
            if (isset($rp['extra_adult_rate'])) $extraAdultRate = floatval($rp['extra_adult_rate']);
            if (isset($rp['extra_child_rate'])) $extraChildRate = floatval($rp['extra_child_rate']);
            if (!empty($rp['cancellation_policy'])) $cancellationPolicy = $rp['cancellation_policy'];
            $ratePlanId = $rp['id'];
        } else {
            $ratePlanId = 'rp_' . strtolower($mealPlan) . '_' . $roomTypeId;
        }

        // 3. Stay dates, nights, rooms, guests
        $nights = max(1, (int)round((strtotime($retDate) - strtotime($depDate)) / 86400));
        $numRooms = max(1, intval($payload['num_rooms'] ?? ($customs['num_rooms'] ?? ($payload['qty'] ?? 1))));
        $adults = max(1, intval($payload['adults'] ?? ($customs['adults'] ?? 2)));
        $children = max(0, intval($payload['children'] ?? ($customs['children'] ?? 0)));

        // 4. Nightly price calculation with calendar overrides & weekend pricing
        $calOverrides = [];
        try {
            $calStmt = $pdo->prepare("SELECT date, price_override FROM hotel_availability_calendar WHERE hotel_id = ? AND (room_type_id = ? OR room_type_id IS NULL OR room_type_id = '') AND date >= ? AND date < ?");
            $calStmt->execute([$hotelId, $roomTypeId, $depDate, $retDate]);
            while ($cRow = $calStmt->fetch(PDO::FETCH_ASSOC)) {
                if (!empty($cRow['price_override']) && floatval($cRow['price_override']) > 0) {
                    $calOverrides[$cRow['date']] = floatval($cRow['price_override']);
                }
            }
        } catch (Exception $ce) {}

        $roomNightsSubtotal = 0;
        $currentTs = strtotime($depDate);
        for ($i = 0; $i < $nights; $i++) {
            $curDateStr = date('Y-m-d', $currentTs);
            $dayOfWeek = (int)date('N', $currentTs); // 1 = Monday, ..., 5 = Friday, 6 = Saturday, 7 = Sunday
            $isWeekend = ($dayOfWeek === 5 || $dayOfWeek === 6); // Fri or Sat

            if (isset($calOverrides[$curDateStr])) {
                $nightlyRate = $calOverrides[$curDateStr];
            } elseif ($isWeekend) {
                $nightlyRate = $weekendRoomRate;
            } else {
                $nightlyRate = $baseRoomRate;
            }

            $nightlyRate += $mealSurchargePerNight;
            $roomNightsSubtotal += ($nightlyRate * $numRooms);
            $currentTs = strtotime('+1 day', $currentTs);
        }

        // 5. Extra Guests Calculation
        $baseOcc = intval($rt['base_occupancy'] ?: 2);
        $totalBaseAdultCapacity = $baseOcc * $numRooms;
        $extraAdults = max(0, $adults - $totalBaseAdultCapacity);
        $extraAdultTotal = $extraAdults * $extraAdultRate * $nights;
        $extraChildTotal = $children * $extraChildRate * $nights;
        $totalExtraGuestCharge = $extraAdultTotal + $extraChildTotal;

        // Subtotal room charges
        $subtotalRoomCharges = $roomNightsSubtotal + $totalExtraGuestCharge;

        // 6. Markup Calculation (from markups table)
        $markupAmount = 0;
        try {
            $mkStmt = $pdo->prepare("SELECT markup_type, markup_value FROM markups WHERE entity_type IN ('hotel', 'all') AND (vendor_id = ? OR vendor_id = 'global') AND (item_id = ? OR item_id = 'all') ORDER BY id DESC LIMIT 1");
            $mkStmt->execute([$hotel['vendor_id'] ?? 'global', $hotelId]);
            $mk = $mkStmt->fetch(PDO::FETCH_ASSOC);
            if ($mk && floatval($mk['markup_value']) > 0) {
                $mVal = floatval($mk['markup_value']);
                if (strtolower($mk['markup_type']) === 'percentage') {
                    $markupAmount = round($subtotalRoomCharges * ($mVal / 100));
                } else {
                    $markupAmount = round($mVal * $nights * $numRooms);
                }
            }
        } catch (Exception $e) {}

        $roomTotalWithMarkup = $subtotalRoomCharges + $markupAmount;

        // 7. GST: 18%
        $gst = round($roomTotalWithMarkup * 0.18);

        // 8. Platform Fee: flat ₹250
        $platformFee = 250;

        // 9. Driver / Chauffeur Charges
        $driverCharge = 0;
        $driverRequired = !empty($payload['driver_required']) && ($payload['driver_required'] == 1 || $payload['driver_required'] === '1' || $payload['driver_required'] === 'yes' || $payload['driver_required'] === true);
        $driverServiceType = trim($payload['driver_service_type'] ?? ($customs['driver_service'] ?? 'airport_transfer'));
        if ($driverRequired) {
            if ($driverServiceType === 'airport_transfer' || $driverServiceType === 'PICKUP' || $driverServiceType === 'DROP') {
                $driverCharge = 800;
            } elseif ($driverServiceType === 'full_day') {
                $driverCharge = 1800;
            } elseif ($driverServiceType === 'entire_stay' || $driverServiceType === 'FULL') {
                $driverCharge = 1500 * $nights;
            } else {
                $driverCharge = 800;
            }
        }

        // Authoritative Total Amount
        $authoritativeTotal = $roomTotalWithMarkup + $gst + $platformFee + $driverCharge;

        // 10. Customer Wallet Benefit (strictly capped at 10% of authoritative total)
        $clientWalletRequested = floatval($payload['wallet_amount_used'] ?? 0);
        $maxAllowedWallet = round($authoritativeTotal * 0.10, 2);
        $appliedWallet = min($clientWalletRequested, $maxAllowedWallet);
        if ($appliedWallet < 0) $appliedWallet = 0;

        $finalPayable = max(0, round($authoritativeTotal - $appliedWallet, 2));

        return [
            'hotel' => $hotel,
            'room_type' => $rt,
            'rate_plan' => $rp,
            'rate_plan_id' => $ratePlanId,
            'meal_plan' => $mealPlan,
            'cancellation_policy' => $cancellationPolicy,
            'nights' => $nights,
            'num_rooms' => $numRooms,
            'adults' => $adults,
            'children' => $children,
            'num_guests' => $adults + $children,
            'base_rate' => $baseRoomRate,
            'weekend_rate' => $weekendRoomRate,
            'meal_surcharge_night' => $mealSurchargePerNight,
            'room_nights_subtotal' => $roomNightsSubtotal,
            'extra_adult_charge' => $extraAdultTotal,
            'extra_child_charge' => $extraChildTotal,
            'markup_amount' => $markupAmount,
            'room_total_with_markup' => $roomTotalWithMarkup,
            'gst' => $gst,
            'platform_fee' => $platformFee,
            'driver_required' => $driverRequired ? 1 : 0,
            'driver_service_type' => $driverRequired ? $driverServiceType : null,
            'driver_charge' => $driverCharge,
            'authoritative_total' => $authoritativeTotal,
            'wallet_amount_used' => $appliedWallet,
            'max_wallet_benefit' => $maxAllowedWallet,
            'final_payable' => $finalPayable
        ];
    }

    /**
     * Get vendor's active cancellation policy and rules.
     */
    public static function getVendorCancellationPolicy(PDO $pdo, ?string $vendorId, string $serviceType = 'all'): ?array {
        if (empty($vendorId)) {
            return null;
        }
        try {
            $stmt = $pdo->prepare("SELECT * FROM vendor_cancellation_policies WHERE vendor_id = ? AND (service_type = ? OR service_type = 'all') AND status = 'Active' ORDER BY CASE WHEN service_type = ? THEN 1 ELSE 2 END, created_at DESC LIMIT 1");
            $stmt->execute([$vendorId, $serviceType, $serviceType]);
            $policy = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$policy) {
                return null;
            }
            $stmtRules = $pdo->prepare("SELECT * FROM vendor_cancellation_rules WHERE policy_id = ? ORDER BY minimum_hours_before DESC");
            $stmtRules->execute([$policy['id']]);
            $rules = $stmtRules->fetchAll(PDO::FETCH_ASSOC);
            $policy['rules'] = $rules ?: [];
            return $policy;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Ensure a default standard cancellation policy exists for a vendor if unconfigured.
     */
    public static function ensureVendorDefaultPolicy(PDO $pdo, string $vendorId, string $serviceType = 'all'): array {
        $policyId = 'vpol_' . substr(md5($vendorId . '_auto'), 0, 12);
        try {
            $ins = $pdo->prepare("INSERT INTO vendor_cancellation_policies (id, vendor_id, service_type, policy_name, allow_after_service_starts, status, created_at, updated_at) VALUES (?, ?, 'all', 'Standard Cancellation Policy', 0, 'Active', datetime('now'), datetime('now'))");
            $ins->execute([$policyId, $vendorId]);

            $rules = [
                ['id' => 'vrule_' . uniqid(), 'policy_id' => $policyId, 'minimum_hours_before' => 168, 'maximum_hours_before' => null, 'refund_percentage' => 90.00, 'cancellation_charge_percentage' => 10.00, 'rule_description' => 'More than 7 days before service: 90% refund'],
                ['id' => 'vrule_' . uniqid(), 'policy_id' => $policyId, 'minimum_hours_before' => 72, 'maximum_hours_before' => 168, 'refund_percentage' => 75.00, 'cancellation_charge_percentage' => 25.00, 'rule_description' => '3–7 days before service: 75% refund'],
                ['id' => 'vrule_' . uniqid(), 'policy_id' => $policyId, 'minimum_hours_before' => 24, 'maximum_hours_before' => 72, 'refund_percentage' => 50.00, 'cancellation_charge_percentage' => 50.00, 'rule_description' => '1–3 days before service: 50% refund'],
                ['id' => 'vrule_' . uniqid(), 'policy_id' => $policyId, 'minimum_hours_before' => 0, 'maximum_hours_before' => 24, 'refund_percentage' => 25.00, 'cancellation_charge_percentage' => 75.00, 'rule_description' => 'Less than 24 hours before service: 25% refund'],
                ['id' => 'vrule_' . uniqid(), 'policy_id' => $policyId, 'minimum_hours_before' => -999999, 'maximum_hours_before' => 0, 'refund_percentage' => 0.00, 'cancellation_charge_percentage' => 100.00, 'rule_description' => 'After service starts: No refund']
            ];

            $insRule = $pdo->prepare("INSERT INTO vendor_cancellation_rules (id, policy_id, minimum_hours_before, maximum_hours_before, refund_percentage, cancellation_charge_percentage, rule_description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))");
            foreach ($rules as $r) {
                $insRule->execute([$r['id'], $policyId, $r['minimum_hours_before'], $r['maximum_hours_before'], $r['refund_percentage'], $r['cancellation_charge_percentage'], $r['rule_description']]);
            }

            return [
                'id' => $policyId,
                'vendor_id' => $vendorId,
                'service_type' => 'all',
                'policy_name' => 'Standard Cancellation Policy',
                'allow_after_service_starts' => 0,
                'status' => 'Active',
                'rules' => $rules
            ];
        } catch (Exception $e) {
            return [
                'id' => $policyId,
                'vendor_id' => $vendorId,
                'service_type' => 'all',
                'policy_name' => 'Standard Cancellation Policy',
                'allow_after_service_starts' => 0,
                'status' => 'Active',
                'rules' => []
            ];
        }
    }

    /**
     * Authoritative calculation of cancellation refund strictly based on Vendor Service Amount.
     * WOW GOA Platform Fee (10%) is NON-REFUNDABLE.
     */
    public static function calculateCancellationRefund(PDO $pdo, array $booking, ?string $cancelTime = null): array {
        // 1. Retrieve snapshot or fallback
        $snapshot = null;
        if (!empty($booking['cancellation_policy_snapshot'])) {
            $snapshot = is_array($booking['cancellation_policy_snapshot']) 
                ? $booking['cancellation_policy_snapshot'] 
                : json_decode($booking['cancellation_policy_snapshot'], true);
        }
        if (!$snapshot || empty($snapshot['rules'])) {
            $vendorId = $booking['vendor_id'] ?? null;
            $serviceType = $booking['type'] ?? 'all';
            $snapshot = self::getVendorCancellationPolicy($pdo, $vendorId, $serviceType);
            if (!$snapshot && !empty($vendorId)) {
                $snapshot = self::ensureVendorDefaultPolicy($pdo, $vendorId, $serviceType);
            }
        }

        $rules = $snapshot['rules'] ?? [];
        $allowAfterStart = !empty($snapshot['allow_after_service_starts']);

        // 2. Determine Service Start Date/Time
        $startDate = $booking['pickup_date'] 
            ?? ($booking['check_in_date'] 
            ?? ($booking['departure_date'] 
            ?? ($booking['start_date'] ?? date('Y-m-d'))));
        
        $startTime = $booking['pickup_time'] 
            ?? ($booking['check_in_time'] 
            ?? '10:00:00');
        
        // Clean start time
        $startDateTimeStr = trim($startDate . ' ' . $startTime);
        $serviceStartTs = strtotime($startDateTimeStr);
        if (!$serviceStartTs) {
            $serviceStartTs = strtotime($startDate . ' 10:00:00');
        }

        $cancelTs = $cancelTime ? strtotime($cancelTime) : time();
        $diffSeconds = $serviceStartTs - $cancelTs;
        $diffHours = $diffSeconds / 3600.0;

        // 3. Find matching rule deterministically
        $appliedRule = null;
        $matchedRefundPct = 0.00;
        $matchedChargePct = 100.00;
        $matchedRuleDesc = 'Standard Cancellation Policy';

        if ($diffHours < 0 && !$allowAfterStart) {
            // Service already started and policy forbids refund after start
            $matchedRefundPct = 0.00;
            $matchedChargePct = 100.00;
            $matchedRuleDesc = 'After service starts: No refund allowed.';
        } else {
            // Sort rules descending by minimum_hours_before
            usort($rules, function($a, $b) {
                return floatval($b['minimum_hours_before']) <=> floatval($a['minimum_hours_before']);
            });

            foreach ($rules as $rule) {
                $minH = floatval($rule['minimum_hours_before']);
                $maxH = ($rule['maximum_hours_before'] !== null && $rule['maximum_hours_before'] !== '') 
                    ? floatval($rule['maximum_hours_before']) 
                    : null;

                if ($maxH === null) {
                    // Unbounded upper window (e.g. > 7 days / 168+ hours)
                    if ($diffHours >= $minH) {
                        $appliedRule = $rule;
                        break;
                    }
                } else {
                    // Bounded window [min, max) e.g. [72, 168), [24, 72), [0, 24)
                    if ($diffHours >= $minH && $diffHours < $maxH) {
                        $appliedRule = $rule;
                        break;
                    }
                }
            }

            if (!$appliedRule && !empty($rules)) {
                if ($diffHours < 0) {
                    $matchedRefundPct = 0.00;
                    $matchedChargePct = 100.00;
                    $matchedRuleDesc = 'After service starts: No refund.';
                } else {
                    $appliedRule = end($rules);
                }
            }

            if ($appliedRule) {
                $matchedRefundPct = floatval($appliedRule['refund_percentage']);
                $matchedChargePct = floatval($appliedRule['cancellation_charge_percentage'] ?? (100 - $matchedRefundPct));
                $matchedRuleDesc = $appliedRule['rule_description'] ?? ("{$matchedRefundPct}% refund policy applied");
            }
        }

        // 4. Financial Calculations based strictly on Vendor Service Amount
        $customerPayment = floatval($booking['customer_payment'] ?: ($booking['total_amount'] ?: 0));
        $wowPlatformFee = floatval($booking['wow_goa_platform_fee'] ?: round($customerPayment * 0.10, 2));
        $vendorServiceAmt = floatval($booking['vendor_service_amount'] ?: round($customerPayment * 0.90, 2));

        $refundAmount = round($vendorServiceAmt * ($matchedRefundPct / 100.0), 2);
        $vendorRetainedAmt = round($vendorServiceAmt - $refundAmount, 2);

        return [
            'booking_id' => $booking['id'],
            'customer_name' => $booking['name'] ?? '',
            'service_name' => $booking['item_name'] ?? '',
            'vendor_id' => $booking['vendor_id'] ?? '',
            'service_start_datetime' => date('Y-m-d H:i:s', $serviceStartTs),
            'cancellation_datetime' => date('Y-m-d H:i:s', $cancelTs),
            'hours_before_service' => round($diffHours, 2),
            'customer_payment' => $customerPayment,
            'wow_goa_platform_fee' => $wowPlatformFee,
            'vendor_service_amount' => $vendorServiceAmt,
            'applied_rule' => $appliedRule,
            'rule_description' => $matchedRuleDesc,
            'refund_percentage' => $matchedRefundPct,
            'cancellation_charge_percentage' => $matchedChargePct,
            'refund_amount' => $refundAmount,
            'vendor_retained_amount' => $vendorRetainedAmt,
            'is_platform_fee_refundable' => false,
            'policy_name' => $snapshot['policy_name'] ?? 'Vendor Cancellation Policy'
        ];
    }
}
