<?php
// backend/hotel_destinations.php
// Hotel Nearby Destinations & Distance Highlight System - Core Service & API Handler

class HotelDestinationsService {

    /**
     * Compute normalized distance in meters
     */
    public static function normalizeDistanceMeters($value, $unit) {
        $val = floatval($value);
        $u = strtolower(trim($unit));
        if ($u === 'kilometres' || $u === 'kilometre' || $u === 'km' || $u === 'kms') {
            return (int)round($val * 1000);
        }
        return (int)round($val);
    }

    /**
     * Calculate default travel times if not provided
     */
    public static function estimateTravelTimes($distanceMeters, $travelMode, $walkingTime = null, $drivingTime = null) {
        $walk = ($walkingTime !== null && $walkingTime !== '') ? intval($walkingTime) : null;
        $drive = ($drivingTime !== null && $drivingTime !== '') ? intval($drivingTime) : null;

        if ($walk === null || $walk <= 0) {
            // ~75 m / min average walking speed
            $walk = max(1, (int)round($distanceMeters / 75));
        }

        if ($drive === null || $drive <= 0) {
            // ~350 m / min average Goa traffic driving speed (~21 km/h)
            $drive = max(1, (int)round($distanceMeters / 350));
        }

        return [$walk, $drive];
    }

    /**
     * Resolve actor from token or payload/query
     */
    public static function resolveActor($pdo, $providedActor = null, $extraPayload = []) {
        if ($providedActor && !empty($providedActor['id'])) {
            return $providedActor;
        }

        if (function_exists('authenticateRequest')) {
            $actor = authenticateRequest($pdo, false);
            if ($actor && !empty($actor['id'])) {
                return $actor;
            }
        }

        // Fallback: Check userId / auth_user_id from payload / query
        $userId = trim($extraPayload['auth_user_id'] ?? ($extraPayload['userId'] ?? ($extraPayload['user_id'] ?? ($extraPayload['submitted_by'] ?? ''))));
        if (!empty($userId)) {
            $stmt = $pdo->prepare("SELECT id, username, email, role FROM users WHERE id = ? OR username = ?");
            $stmt->execute([$userId, $userId]);
            $u = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($u) {
                return $u;
            }
        }

        return null;
    }

    /**
     * Verify actor has ownership of the hotel or is admin/superadmin
     */
    public static function verifyHotelAccess($pdo, $actor, $hotelId) {
        if (!$actor) return [false, 'Authentication required'];
        $role = strtolower($actor['role'] ?? '');
        if ($role === 'superadmin' || $role === 'admin') {
            return [true, 'admin'];
        }

        if ($role === 'hotel_vendor' || $role === 'vendor') {
            $stmt = $pdo->prepare("SELECT id, vendor_id FROM hotels WHERE id = ?");
            $stmt->execute([$hotelId]);
            $hotel = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$hotel) {
                return [false, 'Hotel not found'];
            }
            $vendorId = $actor['id'];
            $hotelVendorId = $hotel['vendor_id'] ?? '';
            // Match vendor id or test accounts
            if ($hotelVendorId === $vendorId || 
                (in_array($vendorId, ['u-5', 'u-4', 'vendor-3']) && in_array($hotelVendorId, ['', 'u-5', 'u-4', 'vendor-3', 'hotel_vendor', null]))) {
                return [true, 'vendor'];
            }
            return [false, 'Access denied: You do not own this hotel property'];
        }

        return [false, 'Unauthorized role'];
    }

    /**
     * Log audit trail
     */
    public static function logAudit($pdo, $destinationId, $action, $oldValues, $newValues, $performedBy, $remarks = null) {
        try {
            $id = 'hlog_' . uniqid();
            $stmt = $pdo->prepare("INSERT INTO hotel_destination_audit_logs 
                (id, destination_id, action, old_values, new_values, performed_by, remarks, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $destinationId,
                $action,
                $oldValues ? (is_string($oldValues) ? $oldValues : json_encode($oldValues)) : null,
                $newValues ? (is_string($newValues) ? $newValues : json_encode($newValues)) : null,
                $performedBy,
                $remarks,
                date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log("Audit log failed: " . $e->getMessage());
        }
    }

    /**
     * Add a nearby destination
     */
    public static function addDestination($pdo, $actor, $data) {
        $hotelId = trim($data['hotel_id'] ?? '');
        if (empty($hotelId)) {
            return ['success' => false, 'error' => 'hotel_id is required', 'code' => 400];
        }

        list($allowed, $accessRole) = self::verifyHotelAccess($pdo, $actor, $hotelId);
        if (!$allowed) {
            return ['success' => false, 'error' => $accessRole, 'code' => 403];
        }

        $destName = trim($data['destination_name'] ?? '');
        $destCategory = trim($data['destination_category'] ?? 'Beaches');
        $distVal = floatval($data['distance_value'] ?? 0);
        $distUnit = trim($data['distance_unit'] ?? 'km');
        $travelMode = trim($data['travel_mode'] ?? 'Walking');

        if (empty($destName)) {
            return ['success' => false, 'error' => 'Destination name is required', 'code' => 400];
        }
        if ($distVal <= 0) {
            return ['success' => false, 'error' => 'Distance value must be greater than zero', 'code' => 400];
        }

        $distMeters = self::normalizeDistanceMeters($distVal, $distUnit);
        list($walkTime, $driveTime) = self::estimateTravelTimes($distMeters, $travelMode, $data['walking_time_minutes'] ?? null, $data['driving_time_minutes'] ?? null);

        // Check for duplicate destination for this hotel
        $stmtDup = $pdo->prepare("SELECT id FROM hotel_nearby_destinations WHERE hotel_id = ? AND LOWER(destination_name) = LOWER(?)");
        $stmtDup->execute([$hotelId, $destName]);
        if ($stmtDup->fetch()) {
            return ['success' => false, 'error' => 'A destination with this name already exists for this hotel.', 'code' => 409];
        }

        // Determine status
        $reqStatus = trim($data['approval_status'] ?? '');
        $isAdmin = ($accessRole === 'admin');
        if ($isAdmin) {
            $status = ($reqStatus === 'DRAFT') ? 'DRAFT' : 'APPROVED';
            $approvedBy = ($status === 'APPROVED') ? $actor['id'] : null;
            $approvedAt = ($status === 'APPROVED') ? date('Y-m-d H:i:s') : null;
        } else {
            // Vendors can submit as DRAFT or PENDING_APPROVAL
            $status = ($reqStatus === 'PENDING_APPROVAL' || !empty($data['submit_for_approval'])) ? 'PENDING_APPROVAL' : 'DRAFT';
            $approvedBy = null;
            $approvedAt = null;
        }

        $id = 'hdest_' . uniqid();
        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("INSERT INTO hotel_nearby_destinations 
            (id, hotel_id, destination_name, destination_category, distance_value, distance_unit, distance_meters, travel_mode, walking_time_minutes, driving_time_minutes, description, image, latitude, longitude, approval_status, rejection_reason, pending_changes, submitted_by, approved_by, approved_at, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $id,
            $hotelId,
            $destName,
            $destCategory,
            $distVal,
            $distUnit,
            $distMeters,
            $travelMode,
            $walkTime,
            $driveTime,
            trim($data['description'] ?? ''),
            trim($data['image'] ?? ''),
            !empty($data['latitude']) ? floatval($data['latitude']) : null,
            !empty($data['longitude']) ? floatval($data['longitude']) : null,
            $status,
            $actor['id'],
            $approvedBy,
            $approvedAt,
            $now,
            $now
        ]);

        $created = self::getDestinationById($pdo, $id);
        self::logAudit($pdo, $id, 'CREATED', null, $created, $actor['id'], "Destination created as {$status}");

        return ['success' => true, 'destination' => $created, 'message' => "Destination created successfully ({$status})."];
    }

    /**
     * Update an existing destination
     */
    public static function updateDestination($pdo, $actor, $data) {
        $id = trim($data['id'] ?? '');
        if (empty($id)) {
            return ['success' => false, 'error' => 'Destination ID is required', 'code' => 400];
        }

        $existing = self::getDestinationById($pdo, $id);
        if (!$existing) {
            return ['success' => false, 'error' => 'Destination not found', 'code' => 404];
        }

        list($allowed, $accessRole) = self::verifyHotelAccess($pdo, $actor, $existing['hotel_id']);
        if (!$allowed) {
            return ['success' => false, 'error' => $accessRole, 'code' => 403];
        }

        $isAdmin = ($accessRole === 'admin');

        $destName = trim($data['destination_name'] ?? $existing['destination_name']);
        $destCategory = trim($data['destination_category'] ?? $existing['destination_category']);
        $distVal = isset($data['distance_value']) ? floatval($data['distance_value']) : floatval($existing['distance_value']);
        $distUnit = trim($data['distance_unit'] ?? $existing['distance_unit']);
        $travelMode = trim($data['travel_mode'] ?? $existing['travel_mode']);
        $description = isset($data['description']) ? trim($data['description']) : $existing['description'];
        $image = isset($data['image']) ? trim($data['image']) : $existing['image'];
        $lat = !empty($data['latitude']) ? floatval($data['latitude']) : $existing['latitude'];
        $lng = !empty($data['longitude']) ? floatval($data['longitude']) : $existing['longitude'];

        $distMeters = self::normalizeDistanceMeters($distVal, $distUnit);
        list($walkTime, $driveTime) = self::estimateTravelTimes($distMeters, $travelMode, $data['walking_time_minutes'] ?? $existing['walking_time_minutes'], $data['driving_time_minutes'] ?? $existing['driving_time_minutes']);

        $now = date('Y-m-d H:i:s');

        // Check rule: When an approved destination is edited by a vendor, retain published version
        if (!$isAdmin && $existing['approval_status'] === 'APPROVED') {
            $pendingPayload = [
                'destination_name' => $destName,
                'destination_category' => $destCategory,
                'distance_value' => $distVal,
                'distance_unit' => $distUnit,
                'distance_meters' => $distMeters,
                'travel_mode' => $travelMode,
                'walking_time_minutes' => $walkTime,
                'driving_time_minutes' => $driveTime,
                'description' => $description,
                'image' => $image,
                'latitude' => $lat,
                'longitude' => $lng,
                'submitted_by' => $actor['id'],
                'updated_at' => $now
            ];

            $stmt = $pdo->prepare("UPDATE hotel_nearby_destinations SET 
                pending_changes = ?, 
                updated_at = ? 
                WHERE id = ?");
            $stmt->execute([json_encode($pendingPayload), $now, $id]);

            self::logAudit($pdo, $id, 'EDIT_SUBMITTED', $existing, $pendingPayload, $actor['id'], "Vendor submitted edits for approved destination (pending approval)");

            return [
                'success' => true, 
                'message' => 'Your edits have been submitted for Admin approval. The currently published version remains visible to customers until reviewed.',
                'destination' => self::getDestinationById($pdo, $id)
            ];
        }

        // Direct update (Admin, or Vendor updating a Draft/Rejected item)
        $newStatus = $existing['approval_status'];
        if ($isAdmin) {
            // Admin updates can stay as whatever status or auto-approve
            if (isset($data['approval_status'])) {
                $newStatus = $data['approval_status'];
            }
        } else {
            // Vendor updating draft/rejected can optionally submit for approval
            if (!empty($data['submit_for_approval'])) {
                $newStatus = 'PENDING_APPROVAL';
            } elseif ($newStatus === 'REJECTED') {
                $newStatus = 'DRAFT';
            }
        }

        $stmt = $pdo->prepare("UPDATE hotel_nearby_destinations SET 
            destination_name = ?, 
            destination_category = ?, 
            distance_value = ?, 
            distance_unit = ?, 
            distance_meters = ?, 
            travel_mode = ?, 
            walking_time_minutes = ?, 
            driving_time_minutes = ?, 
            description = ?, 
            image = ?, 
            latitude = ?, 
            longitude = ?, 
            approval_status = ?, 
            rejection_reason = CASE WHEN ? = 'APPROVED' OR ? = 'PENDING_APPROVAL' THEN NULL ELSE rejection_reason END,
            pending_changes = NULL,
            updated_at = ? 
            WHERE id = ?");

        $stmt->execute([
            $destName,
            $destCategory,
            $distVal,
            $distUnit,
            $distMeters,
            $travelMode,
            $walkTime,
            $driveTime,
            $description,
            $image,
            $lat,
            $lng,
            $newStatus,
            $newStatus,
            $newStatus,
            $now,
            $id
        ]);

        $updated = self::getDestinationById($pdo, $id);
        self::logAudit($pdo, $id, 'UPDATED', $existing, $updated, $actor['id'], "Destination details updated");

        return ['success' => true, 'destination' => $updated, 'message' => 'Destination updated successfully.'];
    }

    /**
     * Submit destination for approval (Vendor action)
     */
    public static function submitForApproval($pdo, $actor, $id) {
        $existing = self::getDestinationById($pdo, $id);
        if (!$existing) {
            return ['success' => false, 'error' => 'Destination not found', 'code' => 404];
        }

        list($allowed, $accessRole) = self::verifyHotelAccess($pdo, $actor, $existing['hotel_id']);
        if (!$allowed) {
            return ['success' => false, 'error' => $accessRole, 'code' => 403];
        }

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("UPDATE hotel_nearby_destinations SET approval_status = 'PENDING_APPROVAL', rejection_reason = NULL, updated_at = ? WHERE id = ?");
        $stmt->execute([$now, $id]);

        $updated = self::getDestinationById($pdo, $id);
        self::logAudit($pdo, $id, 'SUBMITTED', $existing, $updated, $actor['id'], "Submitted for admin approval");

        return ['success' => true, 'destination' => $updated, 'message' => 'Destination submitted for approval.'];
    }

    /**
     * Approve destination (Admin / SuperAdmin action ONLY)
     */
    public static function approveDestination($pdo, $actor, $id) {
        if (!$actor || !in_array(strtolower($actor['role'] ?? ''), ['admin', 'superadmin'])) {
            return ['success' => false, 'error' => 'Forbidden: Only Admins can approve destination records.', 'code' => 403];
        }

        $existing = self::getDestinationById($pdo, $id);
        if (!$existing) {
            return ['success' => false, 'error' => 'Destination not found', 'code' => 404];
        }

        $now = date('Y-m-d H:i:s');

        // Check if there are pending_changes to apply from a previous approved edit
        if (!empty($existing['pending_changes'])) {
            $changes = is_string($existing['pending_changes']) ? json_decode($existing['pending_changes'], true) : $existing['pending_changes'];
            if (is_array($changes)) {
                $stmt = $pdo->prepare("UPDATE hotel_nearby_destinations SET 
                    destination_name = ?, 
                    destination_category = ?, 
                    distance_value = ?, 
                    distance_unit = ?, 
                    distance_meters = ?, 
                    travel_mode = ?, 
                    walking_time_minutes = ?, 
                    driving_time_minutes = ?, 
                    description = ?, 
                    image = ?, 
                    latitude = ?, 
                    longitude = ?, 
                    approval_status = 'APPROVED', 
                    approved_by = ?, 
                    approved_at = ?, 
                    rejection_reason = NULL,
                    pending_changes = NULL,
                    updated_at = ? 
                    WHERE id = ?");

                $stmt->execute([
                    $changes['destination_name'] ?? $existing['destination_name'],
                    $changes['destination_category'] ?? $existing['destination_category'],
                    $changes['distance_value'] ?? $existing['distance_value'],
                    $changes['distance_unit'] ?? $existing['distance_unit'],
                    $changes['distance_meters'] ?? $existing['distance_meters'],
                    $changes['travel_mode'] ?? $existing['travel_mode'],
                    $changes['walking_time_minutes'] ?? $existing['walking_time_minutes'],
                    $changes['driving_time_minutes'] ?? $existing['driving_time_minutes'],
                    $changes['description'] ?? $existing['description'],
                    $changes['image'] ?? $existing['image'],
                    $changes['latitude'] ?? $existing['latitude'],
                    $changes['longitude'] ?? $existing['longitude'],
                    $actor['id'],
                    $now,
                    $now,
                    $id
                ]);

                $updated = self::getDestinationById($pdo, $id);
                self::logAudit($pdo, $id, 'APPROVED_EDITS', $existing, $updated, $actor['id'], "Admin approved pending edits");
                return ['success' => true, 'destination' => $updated, 'message' => 'Pending destination edits approved successfully.'];
            }
        }

        // Standard approval
        $stmt = $pdo->prepare("UPDATE hotel_nearby_destinations SET 
            approval_status = 'APPROVED', 
            approved_by = ?, 
            approved_at = ?, 
            rejection_reason = NULL,
            updated_at = ? 
            WHERE id = ?");
        $stmt->execute([$actor['id'], $now, $now, $id]);

        $updated = self::getDestinationById($pdo, $id);
        self::logAudit($pdo, $id, 'APPROVED', $existing, $updated, $actor['id'], "Destination approved and published");

        return ['success' => true, 'destination' => $updated, 'message' => 'Destination approved and published to customer listings.'];
    }

    /**
     * Reject destination (Admin / SuperAdmin action ONLY)
     */
    public static function rejectDestination($pdo, $actor, $id, $reason) {
        if (!$actor || !in_array(strtolower($actor['role'] ?? ''), ['admin', 'superadmin'])) {
            return ['success' => false, 'error' => 'Forbidden: Only Admins can reject destination submissions.', 'code' => 403];
        }

        $reason = trim($reason ?? '');
        if (empty($reason)) {
            return ['success' => false, 'error' => 'Rejection reason is required.', 'code' => 400];
        }

        $existing = self::getDestinationById($pdo, $id);
        if (!$existing) {
            return ['success' => false, 'error' => 'Destination not found', 'code' => 404];
        }

        $now = date('Y-m-d H:i:s');

        // If rejection of pending_changes on an already approved destination
        if (!empty($existing['pending_changes']) && $existing['approval_status'] === 'APPROVED') {
            $stmt = $pdo->prepare("UPDATE hotel_nearby_destinations SET 
                pending_changes = NULL, 
                rejection_reason = ?, 
                updated_at = ? 
                WHERE id = ?");
            $stmt->execute(["Pending edits rejected: " . $reason, $now, $id]);
            self::logAudit($pdo, $id, 'REJECTED_EDITS', $existing['pending_changes'], null, $actor['id'], $reason);
            return ['success' => true, 'destination' => self::getDestinationById($pdo, $id), 'message' => 'Pending edits rejected. Published destination remains unchanged.'];
        }

        // Standard rejection
        $stmt = $pdo->prepare("UPDATE hotel_nearby_destinations SET 
            approval_status = 'REJECTED', 
            rejection_reason = ?, 
            updated_at = ? 
            WHERE id = ?");
        $stmt->execute([$reason, $now, $id]);

        $updated = self::getDestinationById($pdo, $id);
        self::logAudit($pdo, $id, 'REJECTED', $existing, $updated, $actor['id'], "Submission rejected: {$reason}");

        return ['success' => true, 'destination' => $updated, 'message' => 'Destination rejected with reason provided.'];
    }

    /**
     * Delete destination
     */
    public static function deleteDestination($pdo, $actor, $id) {
        $existing = self::getDestinationById($pdo, $id);
        if (!$existing) {
            return ['success' => false, 'error' => 'Destination not found', 'code' => 404];
        }

        list($allowed, $accessRole) = self::verifyHotelAccess($pdo, $actor, $existing['hotel_id']);
        if (!$allowed) {
            return ['success' => false, 'error' => $accessRole, 'code' => 403];
        }

        $stmt = $pdo->prepare("DELETE FROM hotel_nearby_destinations WHERE id = ?");
        $stmt->execute([$id]);

        self::logAudit($pdo, $id, 'DELETED', $existing, null, $actor['id'], "Destination deleted");

        return ['success' => true, 'message' => 'Destination deleted successfully.'];
    }

    /**
     * Fetch single destination
     */
    public static function getDestinationById($pdo, $id) {
        $stmt = $pdo->prepare("SELECT d.*, h.name as hotel_name, h.area as hotel_area, h.location as hotel_location, h.vendor_id as hotel_vendor_id 
            FROM hotel_nearby_destinations d 
            LEFT JOIN hotels h ON d.hotel_id = h.id 
            WHERE d.id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && !empty($row['pending_changes'])) {
            $row['pending_changes_parsed'] = json_decode($row['pending_changes'], true);
        }
        return $row ?: null;
    }

    /**
     * Fetch approved destinations for a given hotel (Public & Customer-facing)
     */
    public static function getApprovedDestinationsForHotel($pdo, $hotelId) {
        $stmt = $pdo->prepare("SELECT * FROM hotel_nearby_destinations 
            WHERE hotel_id = ? AND approval_status = 'APPROVED' 
            ORDER BY distance_meters ASC");
        $stmt->execute([$hotelId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Fetch all destinations for a vendor's authorized hotels
     */
    public static function getVendorDestinations($pdo, $vendorId, $hotelIdFilter = null) {
        $params = [$vendorId, $vendorId];
        $hotelFilter = "";
        if (!empty($hotelIdFilter)) {
            $hotelFilter = "AND d.hotel_id = ?";
            $params[] = $hotelIdFilter;
        }

        $stmt = $pdo->prepare("SELECT d.*, h.name as hotel_name, h.area as hotel_area, h.location as hotel_location 
            FROM hotel_nearby_destinations d 
            INNER JOIN hotels h ON d.hotel_id = h.id 
            WHERE (h.vendor_id = ? OR (? IN ('u-5', 'u-4', 'vendor-3', 'hotel_vendor') AND (h.vendor_id IS NULL OR h.vendor_id = 'u-5' OR h.vendor_id = 'u-4' OR h.vendor_id = 'vendor-3' OR h.vendor_id = 'hotel_vendor'))) 
            {$hotelFilter} 
            ORDER BY d.hotel_id ASC, d.distance_meters ASC");
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($results as &$r) {
            if (!empty($r['pending_changes'])) {
                $r['pending_changes_parsed'] = json_decode($r['pending_changes'], true);
            }
        }
        return $results ?: [];
    }

    /**
     * Fetch destinations for Admin / SuperAdmin with filters & stats
     */
    public static function getAdminDestinations($pdo, $statusFilter = null, $hotelIdFilter = null) {
        $conditions = ["1=1"];
        $params = [];

        if (!empty($statusFilter) && $statusFilter !== 'all') {
            $conditions[] = "d.approval_status = ?";
            $params[] = $statusFilter;
        }
        if (!empty($hotelIdFilter) && $hotelIdFilter !== 'all') {
            $conditions[] = "d.hotel_id = ?";
            $params[] = $hotelIdFilter;
        }

        $where = implode(" AND ", $conditions);
        $stmt = $pdo->prepare("SELECT d.*, h.name as hotel_name, h.area as hotel_area, h.location as hotel_location, h.vendor_id as hotel_vendor_id 
            FROM hotel_nearby_destinations d 
            LEFT JOIN hotels h ON d.hotel_id = h.id 
            WHERE {$where} 
            ORDER BY CASE WHEN d.approval_status = 'PENDING_APPROVAL' THEN 0 WHEN d.pending_changes IS NOT NULL THEN 1 ELSE 2 END, d.updated_at DESC");
        $stmt->execute($params);
        $destinations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($destinations as &$d) {
            if (!empty($d['pending_changes'])) {
                $d['pending_changes_parsed'] = json_decode($d['pending_changes'], true);
            }
        }

        // Summary counts
        $countsStmt = $pdo->query("SELECT approval_status, COUNT(*) as cnt FROM hotel_nearby_destinations GROUP BY approval_status");
        $counts = ['TOTAL' => 0, 'APPROVED' => 0, 'PENDING_APPROVAL' => 0, 'DRAFT' => 0, 'REJECTED' => 0, 'PENDING_EDITS' => 0];
        while ($row = $countsStmt->fetch(PDO::FETCH_ASSOC)) {
            $st = $row['approval_status'];
            $c = intval($row['cnt']);
            $counts[$st] = $c;
            $counts['TOTAL'] += $c;
        }
        $pendingEditsCount = $pdo->query("SELECT COUNT(*) FROM hotel_nearby_destinations WHERE pending_changes IS NOT NULL")->fetchColumn();
        $counts['PENDING_EDITS'] = intval($pendingEditsCount);

        return [
            'destinations' => $destinations,
            'counts' => $counts
        ];
    }

    /**
     * Batch enrich hotel records with approved nearby destinations and nearest destination
     */
    public static function enrichHotelsWithDestinations($pdo, array &$hotels) {
        if (empty($hotels)) return;

        $hotelIds = array_filter(array_column($hotels, 'id'));
        if (empty($hotelIds)) return;

        $placeholders = implode(',', array_fill(0, count($hotelIds), '?'));
        $stmt = $pdo->prepare("SELECT * FROM hotel_nearby_destinations 
            WHERE hotel_id IN ($placeholders) AND approval_status = 'APPROVED' 
            ORDER BY hotel_id ASC, distance_meters ASC");
        $stmt->execute(array_values($hotelIds));
        $allApproved = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $byHotel = [];
        foreach ($allApproved as $dest) {
            $hId = $dest['hotel_id'];
            if (!isset($byHotel[$hId])) {
                $byHotel[$hId] = [];
            }
            $byHotel[$hId][] = $dest;
        }

        foreach ($hotels as &$hotel) {
            $hId = $hotel['id'] ?? '';
            $dests = $byHotel[$hId] ?? [];
            $hotel['nearby_destinations'] = $dests;
            $hotel['nearest_destination'] = count($dests) > 0 ? $dests[0] : null;
            $hotel['nearby_destinations_count'] = count($dests);
        }
    }
}
