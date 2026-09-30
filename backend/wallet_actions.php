<?php
        if ($action === 'verify_booking_payment' || $action === 'confirm_booking') {
            $booking_id = $payload['booking_id'] ?? null;
            $vendor_id = $payload['vendor_id'] ?? null;
            if (!$booking_id) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Missing booking ID."]);
                exit;
            }
            $res = BookingService::confirmBookingAndDeductPlatformFee($pdo, $booking_id, $vendor_id);
            if (!$res['success']) {
                http_response_code(400);
                echo json_encode($res);
                exit;
            }
            echo json_encode($res);
            exit;

        } elseif ($action === 'reject_booking_payment') {
            $booking_id = $payload['booking_id'];
            $vendor_id = $payload['vendor_id'];
            $stmt = $pdo->prepare("UPDATE bookings SET status = 'Payment Rejected', payment_verification_status = 'Rejected', payment_status = 'Rejected' WHERE id = ?");
            $stmt->execute([$booking_id]);
            echo json_encode(["success" => true, "message" => "Payment rejected successfully."]);
            exit;

        } elseif ($action === 'request_settlement') {
            $vendor_id = $payload['vendor_id'];
            $amount = $payload['amount'];
            $bank_details = $payload['bank_details'];
            $admin_id = $tenant_id;
            
            // Check wallet balance (for payouts, vendor needs positive balance? Wait, if they receive payments directly, they owe the admin commission. If admin receives payments, admin owes vendor. We assume vendor receives payment, hence negative balance means they owe admin. If vendor requests settlement, it means admin collected payment. Let's assume vendor wants to withdraw positive balance.)
            $stmt = $pdo->prepare("SELECT balance FROM wallets WHERE vendor_id = ?");
            $stmt->execute([$vendor_id]);
            $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$wallet || $wallet['balance'] < $amount) {
                throw new Exception("Insufficient wallet balance for settlement.");
            }
            
            $settle_id = uniqid('stl_');
            $stmt = $pdo->prepare("INSERT INTO settlements (id, vendor_id, admin_id, amount, status, bank_details, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, NOW(), NOW())");
            $stmt->execute([$settle_id, $vendor_id, $admin_id, $amount, $bank_details]);
            
            // Deduct requested amount from wallet to prevent double withdrawal
            $new_balance = $wallet['balance'] - $amount;
            $stmt = $pdo->prepare("UPDATE wallets SET balance = ?, updated_at = NOW() WHERE vendor_id = ?");
            $stmt->execute([$new_balance, $vendor_id]);
            
            // Log Txn
            $trans_id = uniqid('txn_');
            $stmt = $pdo->prepare("INSERT INTO wallet_transactions (id, wallet_id, admin_id, amount, type, description, reference_id, created_at) VALUES (?, ?, ?, ?, 'debit', 'Settlement requested', ?, NOW())");
            $stmt->execute([$trans_id, $wallet['id'], $admin_id, $amount, $settle_id]);
            
            echo json_encode(["success" => true, "message" => "Settlement requested successfully."]);
            exit;

        } elseif ($action === 'approve_settlement') {
            $settle_id = $payload['settle_id'];
            $stmt = $pdo->prepare("UPDATE settlements SET status = 'completed', updated_at = NOW() WHERE id = ?");
            $stmt->execute([$settle_id]);
            echo json_encode(["success" => true, "message" => "Settlement approved."]);
            exit;

        } elseif ($action === 'top_up_wallet') {
            $vendor_id = $payload['vendor_id'];
            $amount = $payload['amount'];
            
            $stmt = $pdo->prepare("SELECT * FROM wallets WHERE vendor_id = ?");
            $stmt->execute([$vendor_id]);
            $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$wallet) {
                $wallet_id = uniqid('wall_');
                $stmt = $pdo->prepare("INSERT INTO wallets (id, vendor_id, admin_id, balance, updated_at) VALUES (?, ?, ?, 0.00, NOW())");
                $stmt->execute([$wallet_id, $vendor_id, 'admin']);
                $wallet = ['id' => $wallet_id, 'balance' => 0.00];
            }
            
            $new_balance = $wallet['balance'] + $amount;
            $stmt = $pdo->prepare("UPDATE wallets SET balance = ?, updated_at = NOW() WHERE vendor_id = ?");
            $stmt->execute([$new_balance, $vendor_id]);
            
            $trans_id = uniqid('txn_');
            $stmt = $pdo->prepare("INSERT INTO wallet_transactions (id, wallet_id, admin_id, amount, type, description, reference_id, created_at) VALUES (?, ?, ?, ?, 'credit', 'Manual Wallet Top Up', ?, NOW())");
            $stmt->execute([$trans_id, $wallet['id'], 'admin', $amount, 'topup']);
            
            echo json_encode(["success" => true, "message" => "Wallet topped up successfully."]);
            exit;
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Action not found.", "received" => $action, "payload_action" => $payload['action'] ?? 'missing', "raw" => $raw_input]);
        }
?>
