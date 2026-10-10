<?php
// backend/VendorWalletAlertService.php
/**
 * WOW GOA Authoritative Vendor Minimum Wallet Balance (₹1,000) Alert Service.
 * 
 * Manages threshold evaluation, single-event multi-channel dispatch (SMS, Email,
 * WhatsApp, Portal Popup), duplicate/spam protection, alert state recovery reset,
 * and independent per-channel audit logging.
 */

class VendorWalletAlertService {
    const DEFAULT_MINIMUM_WALLET_BALANCE = 1000.00;

    /**
     * Read the authoritative configurable minimum vendor wallet balance from global_settings.
     */
    public static function getMinimumWalletBalance(PDO $pdo): float {
        try {
            $stmt = $pdo->query("SELECT min_vendor_wallet_balance FROM global_settings LIMIT 1");
            if ($stmt) {
                $val = $stmt->fetchColumn();
                if ($val !== false && is_numeric($val) && floatval($val) > 0) {
                    return round(floatval($val), 2);
                }
            }
        } catch (Exception $e) {
            // Fall back to default
        }
        return self::DEFAULT_MINIMUM_WALLET_BALANCE;
    }

    /**
     * Auto-ensure database columns and audit tables exist.
     */
    public static function ensureSchema(PDO $pdo): void {
        static $initialized = false;
        if ($initialized) return;

        try {
            // 1. vendor_wallets tracking columns
            $cols = $pdo->query("PRAGMA table_info(vendor_wallets)")->fetchAll(PDO::FETCH_ASSOC);
            $colNames = array_column($cols, 'name');

            if (!in_array('low_balance_alert_sent', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN low_balance_alert_sent INT DEFAULT 0");
            }
            if (!in_array('last_low_balance_alert_at', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN last_low_balance_alert_at DATETIME DEFAULT NULL");
            }
            if (!in_array('services_suspended', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN services_suspended INT DEFAULT 0");
            }
            if (!in_array('suspended_at', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN suspended_at DATETIME DEFAULT NULL");
            }
            if (!in_array('suspension_reason', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN suspension_reason TEXT DEFAULT NULL");
            }
            if (!in_array('suspended_by', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN suspended_by VARCHAR(100) DEFAULT NULL");
            }
            if (!in_array('initial_reminders_sent', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN initial_reminders_sent INT DEFAULT 0");
            }
            if (!in_array('last_reminder_at', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN last_reminder_at DATETIME DEFAULT NULL");
            }
            if (!in_array('last_blocked_booking_id', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN last_blocked_booking_id VARCHAR(100) DEFAULT NULL");
            }
            if (!in_array('reactivation_status', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN reactivation_status VARCHAR(50) DEFAULT NULL");
            }
            if (!in_array('reactivation_requested_at', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN reactivation_requested_at DATETIME DEFAULT NULL");
            }
            if (!in_array('reactivation_message', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN reactivation_message TEXT DEFAULT NULL");
            }
            if (!in_array('reactivation_rejection_reason', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN reactivation_rejection_reason TEXT DEFAULT NULL");
            }
            if (!in_array('suspension_decision_notified', $colNames)) {
                $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN suspension_decision_notified INT DEFAULT 0");
            }

            // 2. global_settings min threshold & escalation columns
            $gCols = $pdo->query("PRAGMA table_info(global_settings)")->fetchAll(PDO::FETCH_ASSOC);
            $gColNames = array_column($gCols, 'name');
            if (!in_array('min_vendor_wallet_balance', $gColNames)) {
                $pdo->exec("ALTER TABLE global_settings ADD COLUMN min_vendor_wallet_balance DECIMAL(10,2) DEFAULT 1000.00");
                $pdo->exec("UPDATE global_settings SET min_vendor_wallet_balance = 1000.00 WHERE min_vendor_wallet_balance IS NULL");
            }
            if (!in_array('max_negative_bookings', $gColNames)) {
                $pdo->exec("ALTER TABLE global_settings ADD COLUMN max_negative_bookings INT DEFAULT 2");
                $pdo->exec("UPDATE global_settings SET max_negative_bookings = 2 WHERE max_negative_bookings IS NULL");
            }
            if (!in_array('wallet_reminder_frequency_hours', $gColNames)) {
                $pdo->exec("ALTER TABLE global_settings ADD COLUMN wallet_reminder_frequency_hours INT DEFAULT 2");
                $pdo->exec("UPDATE global_settings SET wallet_reminder_frequency_hours = 2 WHERE wallet_reminder_frequency_hours IS NULL");
            }
            if (!in_array('max_initial_reminders', $gColNames)) {
                $pdo->exec("ALTER TABLE global_settings ADD COLUMN max_initial_reminders INT DEFAULT 2");
                $pdo->exec("UPDATE global_settings SET max_initial_reminders = 2 WHERE max_initial_reminders IS NULL");
            }
            if (!in_array('wallet_alert_channels', $gColNames)) {
                $pdo->exec("ALTER TABLE global_settings ADD COLUMN wallet_alert_channels VARCHAR(255) DEFAULT 'SMS,Email,WhatsApp,Portal'");
                $pdo->exec("UPDATE global_settings SET wallet_alert_channels = 'SMS,Email,WhatsApp,Portal' WHERE wallet_alert_channels IS NULL");
            }

            // 3. Independent audit log table for multi-channel alerts
            $pdo->exec("CREATE TABLE IF NOT EXISTS vendor_wallet_alert_logs (
                id VARCHAR(100) PRIMARY KEY,
                alert_id VARCHAR(100) NOT NULL,
                vendor_id VARCHAR(100) NOT NULL,
                channel VARCHAR(50) NOT NULL,
                threshold DECIMAL(10,2) NOT NULL,
                wallet_balance DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) NOT NULL,
                provider VARCHAR(100) DEFAULT NULL,
                provider_message_id VARCHAR(255) DEFAULT NULL,
                recipient VARCHAR(255) DEFAULT NULL,
                error_message TEXT DEFAULT NULL,
                payload_preview TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                sent_at DATETIME DEFAULT NULL,
                event_type VARCHAR(50) DEFAULT 'LOW_BALANCE'
            )");

            $logCols = $pdo->query("PRAGMA table_info(vendor_wallet_alert_logs)")->fetchAll(PDO::FETCH_ASSOC);
            $logColNames = array_column($logCols, 'name');
            if (!in_array('event_type', $logColNames)) {
                $pdo->exec("ALTER TABLE vendor_wallet_alert_logs ADD COLUMN event_type VARCHAR(50) DEFAULT 'LOW_BALANCE'");
            }

            // 4. Portal alert dismissal tracking table
            $pdo->exec("CREATE TABLE IF NOT EXISTS vendor_wallet_alert_dismissals (
                vendor_id VARCHAR(100) NOT NULL,
                alert_id VARCHAR(100) NOT NULL,
                dismissed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (vendor_id, alert_id)
            )");

            // 5. Notifications table metadata column
            $notifCols = $pdo->query("PRAGMA table_info(notifications)")->fetchAll(PDO::FETCH_ASSOC);
            $notifColNames = array_column($notifCols, 'name');
            if (!in_array('metadata_json', $notifColNames)) {
                $pdo->exec("ALTER TABLE notifications ADD COLUMN metadata_json TEXT DEFAULT NULL");
            }

            $initialized = true;
        } catch (Exception $e) {
            // Ignore schema setup errors if already migrated
        }
    }

    /**
     * Authoritative Vendor Data Resolution (phone, email, name).
     */
    public static function getVendorDetails(PDO $pdo, string $vendorId): array {
        try {
            $stmt = $pdo->prepare("
                SELECT 
                    w.vendor_id,
                    COALESCE(NULLIF(v.name, ''), NULLIF(u.name, ''), NULLIF(u.username, ''), w.vendor_id) AS name,
                    COALESCE(NULLIF(v.phone, ''), NULLIF(u.phone, '')) AS phone,
                    COALESCE(NULLIF(v.email, ''), NULLIF(u.email, '')) AS email
                FROM vendor_wallets w
                LEFT JOIN users u ON u.id = w.vendor_id OR u.username = w.vendor_id
                LEFT JOIN vendors v ON v.id = w.vendor_id
                WHERE w.vendor_id = ?
                LIMIT 1
            ");
            $stmt->execute([$vendorId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                return [
                    'id' => $vendorId,
                    'name' => trim($row['name'] ?? $vendorId),
                    'phone' => preg_replace('/[^\d+]/', '', $row['phone'] ?? ''),
                    'email' => trim($row['email'] ?? '')
                ];
            }
        } catch (Exception $e) {}

        // Fallback to direct user/vendor table lookup
        try {
            $stmtU = $pdo->prepare("SELECT id, name, username, phone, email FROM users WHERE id = ? OR username = ? LIMIT 1");
            $stmtU->execute([$vendorId, $vendorId]);
            $u = $stmtU->fetch(PDO::FETCH_ASSOC);
            if ($u) {
                return [
                    'id' => $u['id'] ?? $vendorId,
                    'name' => trim($u['name'] ?? ($u['username'] ?? $vendorId)),
                    'phone' => preg_replace('/[^\d+]/', '', $u['phone'] ?? ''),
                    'email' => trim($u['email'] ?? '')
                ];
            }
        } catch (Exception $e) {}

        return ['id' => $vendorId, 'name' => $vendorId, 'phone' => '', 'email' => ''];
    }

    /**
     * Core Authoritative Threshold Evaluator & Event Trigger.
     * Evaluates whether wallet has crossed from ABOVE to <= threshold or needs initial alert.
     */
    public static function checkAndTriggerLowBalanceAlert(
        PDO $pdo, 
        string $vendorId, 
        float $balanceBefore, 
        float $balanceAfter, 
        string $reason = ''
    ): array {
        self::ensureSchema($pdo);
        $threshold = self::getMinimumWalletBalance($pdo);

        // 1. Must be at or below threshold
        if ($balanceAfter > $threshold) {
            return [
                'triggered' => false,
                'reason' => "Wallet balance (₹{$balanceAfter}) is above threshold (₹{$threshold})."
            ];
        }

        // 2. Fetch current wallet record to inspect alert sent flag
        $stmtW = $pdo->prepare("SELECT balance, low_balance_alert_sent FROM vendor_wallets WHERE vendor_id = ?");
        $stmtW->execute([$vendorId]);
        $wallet = $stmtW->fetch(PDO::FETCH_ASSOC);

        if (!$wallet) {
            return ['triggered' => false, 'reason' => "Vendor wallet record not found."];
        }

        $alreadySent = intval($wallet['low_balance_alert_sent'] ?? 0);

        // 3. Trigger condition:
        // A) Crossed from above threshold ($balanceBefore > $threshold && $balanceAfter <= $threshold)
        // OR B) Balance is <= threshold but alert has not yet been sent for this low-balance period
        $crossedDown = ($balanceBefore > $threshold && $balanceAfter <= $threshold);
        $needsFirstAlert = ($balanceAfter <= $threshold && $alreadySent === 0);

        if (!$crossedDown && !$needsFirstAlert) {
            return [
                'triggered' => false,
                'reason' => "Low-balance alert already sent for current low-balance period (duplicate prevented)."
            ];
        }

        // 4. Atomic lock to claim alert execution and prevent concurrent race conditions
        $stmtClaim = $pdo->prepare("
            UPDATE vendor_wallets 
            SET low_balance_alert_sent = 1, last_low_balance_alert_at = CURRENT_TIMESTAMP
            WHERE vendor_id = ? AND (low_balance_alert_sent = 0 OR low_balance_alert_sent IS NULL)
        ");
        $stmtClaim->execute([$vendorId]);

        if ($stmtClaim->rowCount() === 0 && !$crossedDown) {
            // Concurrent execution already claimed the alert
            return [
                'triggered' => false,
                'reason' => "Alert already claimed by concurrent process."
            ];
        }

        // 5. Generate single authoritative Alert Event ID
        $alertId = 'alert_low_bal_' . uniqid() . '_' . rand(100, 999);
        $vendor = self::getVendorDetails($pdo, $vendorId);

        // 6. Format dynamic authoritative message
        $formattedBal = ($balanceAfter < 0) 
            ? "-₹" . number_format(abs($balanceAfter), 2) 
            : "₹" . number_format($balanceAfter, 2);
        $formattedThresh = "₹" . number_format($threshold, 2);

        if ($balanceAfter < 0) {
            $smsText = "WOW GOA: Your vendor wallet balance is {$formattedBal}. Please recharge your vendor wallet to restore the required minimum balance of {$formattedThresh} to avoid booking restrictions.";
        } elseif ($balanceAfter == 0) {
            $smsText = "WOW GOA: Your vendor wallet balance is ₹0. Please recharge your vendor wallet to maintain the required minimum balance of {$formattedThresh} to avoid booking restrictions.";
        } else {
            $smsText = "WOW GOA: Your vendor wallet balance is {$formattedBal}. Please maintain the required minimum wallet balance of {$formattedThresh} to avoid booking restrictions.";
        }

        // 7. Dispatch to all 4 channels independently
        $results = [
            'triggered' => true,
            'alert_id' => $alertId,
            'vendor_id' => $vendorId,
            'balance' => $balanceAfter,
            'threshold' => $threshold,
            'channels' => []
        ];

        // Channel 1: SMS
        $results['channels']['sms'] = self::dispatchSmsChannel(
            $pdo, $alertId, $vendorId, $vendor['phone'], $balanceAfter, $threshold, $smsText
        );

        // Channel 2: EMAIL
        $results['channels']['email'] = self::dispatchEmailChannel(
            $pdo, $alertId, $vendorId, $vendor['email'], $vendor['name'], $balanceAfter, $threshold, $smsText
        );

        // Channel 3: WHATSAPP
        $results['channels']['whatsapp'] = self::dispatchWhatsAppChannel(
            $pdo, $alertId, $vendorId, $vendor['phone'], $balanceAfter, $threshold, $smsText
        );

        // Channel 4: VENDOR PORTAL POPUP / NOTIFICATION
        $results['channels']['portal'] = self::dispatchPortalChannel(
            $pdo, $alertId, $vendorId, $balanceAfter, $threshold, $smsText
        );

        return $results;
    }

    /**
     * Alert Recovery Reset.
     * When vendor recharges and wallet returns ABOVE threshold, reset alert state
     * so that any future drop will trigger a fresh alert.
     */
    public static function resetLowBalanceAlertState(PDO $pdo, string $vendorId, float $newBalance): bool {
        self::ensureSchema($pdo);
        $threshold = self::getMinimumWalletBalance($pdo);

        if ($newBalance > $threshold) {
            $stmt = $pdo->prepare("UPDATE vendor_wallets SET low_balance_alert_sent = 0 WHERE vendor_id = ?");
            $stmt->execute([$vendorId]);
            return true;
        }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHANNEL 1: SMS DISPATCH & EXTENSIBILITY ADAPTER
    // ─────────────────────────────────────────────────────────────────────────
    private static function dispatchSmsChannel(
        PDO $pdo, string $alertId, string $vendorId, string $phone, float $balance, float $threshold, string $message
    ): array {
        $logId = 'log_sms_' . uniqid();
        $provider = getenv('SMS_PROVIDER') ?: 'NONE';
        
        $hasRealProvider = false;
        $status = 'PENDING_GATEWAY_CONFIG';
        $errorMsg = 'No SMS provider gateway configured yet. Alert logged as PENDING_GATEWAY_CONFIG.';
        $providerMsgId = null;

        if (!empty($phone) && $provider !== 'NONE' && !empty(getenv('SMS_API_KEY'))) {
            // Future configuration hook: real SMS gateway call
            $sendRes = self::sendViaSmsGateway($provider, $phone, $message);
            $hasRealProvider = true;
            $status = $sendRes['status'];
            $providerMsgId = $sendRes['message_id'] ?? null;
            $errorMsg = $sendRes['error'] ?? null;
        }

        self::recordAlertLog($pdo, [
            'id' => $logId,
            'alert_id' => $alertId,
            'vendor_id' => $vendorId,
            'channel' => 'SMS',
            'threshold' => $threshold,
            'wallet_balance' => $balance,
            'status' => $status,
            'provider' => $hasRealProvider ? $provider : 'SMS_GATEWAY_UNCONFIGURED',
            'provider_message_id' => $providerMsgId,
            'recipient' => $phone ?: 'NO_PHONE_ON_RECORD',
            'error_message' => $errorMsg,
            'payload_preview' => substr($message, 0, 255),
            'sent_at' => ($status === 'SENT') ? date('Y-m-d H:i:s') : null
        ]);

        return ['status' => $status, 'recipient' => $phone, 'provider' => $provider, 'error' => $errorMsg];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHANNEL 2: EMAIL DISPATCH & EXTENSIBILITY ADAPTER
    // ─────────────────────────────────────────────────────────────────────────
    private static function dispatchEmailChannel(
        PDO $pdo, string $alertId, string $vendorId, string $email, string $name, float $balance, float $threshold, string $summaryText
    ): array {
        $logId = 'log_email_' . uniqid();
        $provider = getenv('EMAIL_PROVIDER') ?: 'NONE';
        
        $hasRealProvider = false;
        $status = 'PENDING_GATEWAY_CONFIG';
        $errorMsg = 'No outbound email provider/transport configured yet. Alert logged as PENDING_GATEWAY_CONFIG.';
        $providerMsgId = null;

        $subject = "WOW GOA — Minimum Vendor Wallet Balance Alert";
        $formattedBal = ($balance < 0) ? "-₹" . number_format(abs($balance), 2) : "₹" . number_format($balance, 2);
        $formattedThresh = "₹" . number_format($threshold, 2);

        $body = "Dear {$name},\n\nYour WOW GOA vendor wallet balance is {$formattedBal}.\n" .
                "The required minimum vendor wallet balance is {$formattedThresh}.\n\n" .
                "Please recharge your vendor wallet to maintain the required minimum balance and avoid booking restrictions.\n\n" .
                "— WOW GOA Vendor Operations Team";

        if (!empty($email) && ($provider !== 'NONE' || getenv('SMTP_HOST'))) {
            // Future configuration hook: real SMTP / SendGrid / SES
            $sendRes = self::sendViaEmailGateway($provider, $email, $subject, $body);
            $hasRealProvider = true;
            $status = $sendRes['status'];
            $providerMsgId = $sendRes['message_id'] ?? null;
            $errorMsg = $sendRes['error'] ?? null;
        }

        self::recordAlertLog($pdo, [
            'id' => $logId,
            'alert_id' => $alertId,
            'vendor_id' => $vendorId,
            'channel' => 'EMAIL',
            'threshold' => $threshold,
            'wallet_balance' => $balance,
            'status' => $status,
            'provider' => $hasRealProvider ? $provider : 'EMAIL_GATEWAY_UNCONFIGURED',
            'provider_message_id' => $providerMsgId,
            'recipient' => $email ?: 'NO_EMAIL_ON_RECORD',
            'error_message' => $errorMsg,
            'payload_preview' => substr($body, 0, 255),
            'sent_at' => ($status === 'SENT') ? date('Y-m-d H:i:s') : null
        ]);

        return ['status' => $status, 'recipient' => $email, 'provider' => $provider, 'error' => $errorMsg];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHANNEL 3: WHATSAPP DISPATCH & EXTENSIBILITY ADAPTER
    // ─────────────────────────────────────────────────────────────────────────
    private static function dispatchWhatsAppChannel(
        PDO $pdo, string $alertId, string $vendorId, string $phone, float $balance, float $threshold, string $summaryText
    ): array {
        $logId = 'log_wa_' . uniqid();
        $provider = getenv('WHATSAPP_PROVIDER') ?: 'NONE';
        
        $hasRealProvider = false;
        $status = 'PENDING_GATEWAY_CONFIG';
        $errorMsg = 'No WhatsApp Business API configured yet. Alert logged as PENDING_GATEWAY_CONFIG.';
        $providerMsgId = null;

        $formattedBal = ($balance < 0) ? "-₹" . number_format(abs($balance), 2) : "₹" . number_format($balance, 2);
        $formattedThresh = "₹" . number_format($threshold, 2);

        $waText = "🌴 *WOW GOA Alert*\n\n" .
                  "Your vendor wallet balance is *{$formattedBal}*.\n" .
                  "Required minimum wallet balance: *{$formattedThresh}*.\n\n" .
                  "Please recharge your vendor wallet to maintain the required minimum balance and avoid booking restrictions.";

        if (!empty($phone) && $provider !== 'NONE' && !empty(getenv('WHATSAPP_TOKEN'))) {
            // Future configuration hook: Meta Cloud API / Twilio WhatsApp
            $sendRes = self::sendViaWhatsAppGateway($provider, $phone, $waText);
            $hasRealProvider = true;
            $status = $sendRes['status'];
            $providerMsgId = $sendRes['message_id'] ?? null;
            $errorMsg = $sendRes['error'] ?? null;
        }

        self::recordAlertLog($pdo, [
            'id' => $logId,
            'alert_id' => $alertId,
            'vendor_id' => $vendorId,
            'channel' => 'WHATSAPP',
            'threshold' => $threshold,
            'wallet_balance' => $balance,
            'status' => $status,
            'provider' => $hasRealProvider ? $provider : 'WHATSAPP_GATEWAY_UNCONFIGURED',
            'provider_message_id' => $providerMsgId,
            'recipient' => $phone ?: 'NO_PHONE_ON_RECORD',
            'error_message' => $errorMsg,
            'payload_preview' => substr($waText, 0, 255),
            'sent_at' => ($status === 'SENT') ? date('Y-m-d H:i:s') : null
        ]);

        return ['status' => $status, 'recipient' => $phone, 'provider' => $provider, 'error' => $errorMsg];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHANNEL 4: VENDOR PORTAL POPUP / NOTIFICATION DISPATCH
    // ─────────────────────────────────────────────────────────────────────────
    private static function dispatchPortalChannel(
        PDO $pdo, string $alertId, string $vendorId, float $balance, float $threshold, string $message
    ): array {
        $logId = 'log_portal_' . uniqid();
        $notifId = 'notif_low_bal_' . uniqid();

        try {
            $stmtNotif = $pdo->prepare("
                INSERT INTO notifications (
                    user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                ) VALUES (?, 'vendor', 'MINIMUM_WALLET_BALANCE', '⚠ WALLET BALANCE LOW', ?, 'wallet_alert', ?, 0, CURRENT_TIMESTAMP)
            ");
            $stmtNotif->execute([$vendorId, $message, $alertId]);
            $notifId = (string)$pdo->lastInsertId();
            $status = 'DELIVERED';
            $errorMsg = null;
        } catch (Exception $e) {
            $notifId = null;
            $status = 'FAILED';
            $errorMsg = $e->getMessage();
        }

        self::recordAlertLog($pdo, [
            'id' => $logId,
            'alert_id' => $alertId,
            'vendor_id' => $vendorId,
            'channel' => 'PORTAL',
            'threshold' => $threshold,
            'wallet_balance' => $balance,
            'status' => $status,
            'provider' => 'INTERNAL_PORTAL',
            'provider_message_id' => $notifId,
            'recipient' => $vendorId,
            'error_message' => $errorMsg,
            'payload_preview' => substr($message, 0, 255),
            'sent_at' => ($status === 'DELIVERED') ? date('Y-m-d H:i:s') : null
        ]);

        return ['status' => $status, 'notification_id' => $notifId, 'error' => $errorMsg];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FUTURE GATEWAY HOOKS (Production-Ready Stubs without Fake Delivery)
    // ─────────────────────────────────────────────────────────────────────────
    private static function sendViaSmsGateway(string $provider, string $phone, string $msg): array {
        return ['status' => 'PENDING_GATEWAY_CONFIG', 'error' => "SMS Provider {$provider} requires API credentials."];
    }

    private static function sendViaEmailGateway(string $provider, string $email, string $subject, string $body): array {
        return ['status' => 'PENDING_GATEWAY_CONFIG', 'error' => "Email Provider requires outbound SMTP credentials."];
    }

    private static function sendViaWhatsAppGateway(string $provider, string $phone, string $msg): array {
        return ['status' => 'PENDING_GATEWAY_CONFIG', 'error' => "WhatsApp Provider requires WhatsApp Cloud API credentials."];
    }

    /**
     * Record per-channel audit log entry.
     */
    private static function recordAlertLog(PDO $pdo, array $data): void {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO vendor_wallet_alert_logs (
                    id, alert_id, vendor_id, channel, threshold, wallet_balance, status,
                    provider, provider_message_id, recipient, error_message, payload_preview, created_at, sent_at, event_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
            ");
            $stmt->execute([
                $data['id'],
                $data['alert_id'],
                $data['vendor_id'],
                $data['channel'],
                $data['threshold'],
                $data['wallet_balance'],
                $data['status'],
                $data['provider'],
                $data['provider_message_id'],
                $data['recipient'],
                $data['error_message'],
                $data['payload_preview'],
                $data['sent_at'],
                $data['event_type'] ?? 'LOW_BALANCE'
            ]);
        } catch (Exception $e) {
            // Never break accounting or main execution on log insert error
        }
    }

    /**
     * Check if a vendor has an active low-balance alert for Vendor Portal Popup.
     */
    public static function getActivePortalAlert(PDO $pdo, string $vendorId): ?array {
        self::ensureSchema($pdo);
        $threshold = self::getMinimumWalletBalance($pdo);

        try {
            $stmtW = $pdo->prepare("SELECT balance, low_balance_alert_sent, last_low_balance_alert_at FROM vendor_wallets WHERE vendor_id = ?");
            $stmtW->execute([$vendorId]);
            $wallet = $stmtW->fetch(PDO::FETCH_ASSOC);

            if (!$wallet) return null;

            $balance = floatval($wallet['balance'] ?? 0.00);
            $alertSent = intval($wallet['low_balance_alert_sent'] ?? 0);

            // 1. Check for most recent manual recharge reminder or escalation reminder
            $stmtMan = $pdo->prepare("
                SELECT alert_id, payload_preview, event_type, created_at 
                FROM vendor_wallet_alert_logs 
                WHERE vendor_id = ? AND channel = 'PORTAL' AND event_type IN ('MANUAL_REMINDER', 'ESCALATION_REMINDER', 'REMINDER_1', 'REMINDER_2')
                ORDER BY id DESC LIMIT 1
            ");
            $stmtMan->execute([$vendorId]);
            $lastManual = $stmtMan->fetch(PDO::FETCH_ASSOC);

            if ($lastManual) {
                $isSuspended = intval($wallet['services_suspended'] ?? 0) === 1;
                $isRestricted = ($balance < 0 || $isSuspended);

                // Check if vendor has completed an approved recharge after this reminder was created
                $stmtCompletedRecharge = $pdo->prepare("
                    SELECT 1 FROM wallet_transactions 
                    WHERE vendor_id = ? AND status = 'Completed' AND created_at >= ?
                    LIMIT 1
                ");
                $stmtCompletedRecharge->execute([$vendorId, $lastManual['created_at']]);
                $hasCompletedRechargeAfter = (bool)$stmtCompletedRecharge->fetch();

                // If vendor is no longer restricted (balance >= 0 and not suspended), or if approved recharge occurred after reminder:
                if (!$isRestricted || ($hasCompletedRechargeAfter && $balance >= 0)) {
                    // Recharge required notice is resolved by successful recharge / non-negative balance
                } else {
                    $alertId = $lastManual['alert_id'];
                    $stmtD = $pdo->prepare("SELECT 1 FROM vendor_wallet_alert_dismissals WHERE vendor_id = ? AND alert_id = ?");
                    $stmtD->execute([$vendorId, $alertId]);
                    if (!$stmtD->fetch()) {
                        return [
                            'active' => true,
                            'alert_id' => $alertId,
                            'vendor_id' => $vendorId,
                            'balance' => $balance,
                            'threshold' => $threshold,
                            'event_type' => $lastManual['event_type'],
                            'message' => $lastManual['payload_preview'] ?? '',
                            'created_at' => $lastManual['created_at']
                        ];
                    }
                }
            }

            // 2. If balance is at or below threshold and alert was sent
            if ($balance <= $threshold && $alertSent === 1) {
                // Check if the most recent alert was dismissed
                $stmtAlert = $pdo->prepare("
                    SELECT alert_id, payload_preview, created_at 
                    FROM vendor_wallet_alert_logs 
                    WHERE vendor_id = ? AND channel = 'PORTAL'
                    ORDER BY created_at DESC LIMIT 1
                ");
                $stmtAlert->execute([$vendorId]);
                $lastAlert = $stmtAlert->fetch(PDO::FETCH_ASSOC);

                if ($lastAlert) {
                    $alertId = $lastAlert['alert_id'];
                    $stmtD = $pdo->prepare("SELECT 1 FROM vendor_wallet_alert_dismissals WHERE vendor_id = ? AND alert_id = ?");
                    $stmtD->execute([$vendorId, $alertId]);
                    if ($stmtD->fetch()) {
                        // Already dismissed by the vendor for this alert ID
                        return null;
                    }

                    return [
                        'active' => true,
                        'alert_id' => $alertId,
                        'vendor_id' => $vendorId,
                        'balance' => $balance,
                        'threshold' => $threshold,
                        'event_type' => 'LOW_BALANCE',
                        'message' => $lastAlert['payload_preview'] ?? '',
                        'created_at' => $lastAlert['created_at']
                    ];
                }
            }
        } catch (Exception $e) {}

        return null;
    }

    /**
     * Dismiss the portal alert for a given alert ID.
     */
    public static function dismissPortalAlert(PDO $pdo, string $vendorId, string $alertId): bool {
        self::ensureSchema($pdo);
        try {
            $stmt = $pdo->prepare("REPLACE INTO vendor_wallet_alert_dismissals (vendor_id, alert_id, dismissed_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
            $stmt->execute([$vendorId, $alertId]);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ESCALATION, BLOCKED BOOKING ALERTS, MANUAL SUSPENSION & REACTIVATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Read global escalation settings from the single global_settings configuration.
     */
    public static function getEscalationSettings(PDO $pdo): array {
        self::ensureSchema($pdo);
        $defaults = [
            'frequency_hours' => 2,
            'max_initial_reminders' => 2,
            'channels' => ['SMS', 'Email', 'WhatsApp', 'Portal'],
            'min_vendor_wallet_balance' => 1000.00,
            'max_negative_bookings' => 2
        ];
        try {
            $stmt = $pdo->query("SELECT * FROM global_settings LIMIT 1");
            $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
            if ($row) {
                if (isset($row['wallet_reminder_frequency_hours']) && floatval($row['wallet_reminder_frequency_hours']) > 0) {
                    $defaults['frequency_hours'] = floatval($row['wallet_reminder_frequency_hours']);
                }
                if (isset($row['max_initial_reminders']) && intval($row['max_initial_reminders']) >= 0) {
                    $defaults['max_initial_reminders'] = intval($row['max_initial_reminders']);
                }
                if (!empty($row['wallet_alert_channels'])) {
                    $defaults['channels'] = array_map('trim', explode(',', $row['wallet_alert_channels']));
                }
                if (isset($row['min_vendor_wallet_balance'])) {
                    $defaults['min_vendor_wallet_balance'] = floatval($row['min_vendor_wallet_balance']);
                }
                if (isset($row['max_negative_bookings'])) {
                    $defaults['max_negative_bookings'] = intval($row['max_negative_bookings']);
                }
            }
        } catch (Exception $e) {}
        return $defaults;
    }

    /**
     * Trigger Authoritative Blocked Booking Alert.
     * Attached strictly to the existing WALLET_BLOCKED branch.
     * Prevents duplicate alert spam.
     */
    public static function triggerBookingBlockedAlert(
        PDO $pdo,
        string $vendorId,
        string $bookingId,
        float $currentBalance,
        int $negativeCount,
        int $maxNegativeBookings
    ): array {
        self::ensureSchema($pdo);

        // 1. Duplicate alert prevention: check if this blocked booking already dispatched an alert
        try {
            $stmtRecentNotif = $pdo->prepare("SELECT 1 FROM notifications WHERE type = 'VENDOR_BOOKING_BLOCKED' AND reference_id = ? LIMIT 1");
            $stmtRecentNotif->execute([$bookingId]);
            if ($stmtRecentNotif->fetch()) {
                return ['triggered' => false, 'reason' => "Duplicate blocked booking alert prevented for booking #{$bookingId}."];
            }

            $stmtDup = $pdo->prepare("SELECT 1 FROM vendor_wallet_alert_logs WHERE vendor_id = ? AND event_type = 'BOOKING_BLOCKED' AND alert_id LIKE ? LIMIT 1");
            $stmtDup->execute([$vendorId, "%_{$bookingId}_%"]);
            if ($stmtDup->fetch()) {
                return ['triggered' => false, 'reason' => "Duplicate blocked booking alert prevented for booking #{$bookingId}."];
            }

            // Also check vendor_wallets for repeat click on same blocked booking
            $stmtWCheck = $pdo->prepare("SELECT last_blocked_booking_id FROM vendor_wallets WHERE vendor_id = ?");
            $stmtWCheck->execute([$vendorId]);
            $wCheck = $stmtWCheck->fetch(PDO::FETCH_ASSOC);
            if ($wCheck && ($wCheck['last_blocked_booking_id'] ?? '') === $bookingId) {
                return ['triggered' => false, 'reason' => "Duplicate blocked booking notification already exists for booking #{$bookingId}."];
            }
        } catch (Exception $e) {}

        // 2. Fetch booking & customer details
        $customerInfo = [
            'booking_id' => $bookingId,
            'type' => 'vehicle',
            'name' => 'Valued Customer',
            'phone' => '',
            'email' => '',
            'contact' => '',
            'booking_dates' => '',
            'service_name' => '',
            'status' => 'Pending',
            'neutral_status' => 'Pending Confirmation',
            'blocked_at' => date('Y-m-d H:i:s')
        ];

        try {
            $stmtB = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
            $stmtB->execute([$bookingId]);
            $bRow = $stmtB->fetch(PDO::FETCH_ASSOC);
            if ($bRow) {
                $customerInfo['type'] = $bRow['type'] ?? 'vehicle';
                $customerInfo['name'] = !empty(trim($bRow['name'] ?? '')) ? trim($bRow['name']) : 'Valued Customer';
                $customerInfo['phone'] = $bRow['phone'] ?? '';
                $customerInfo['email'] = $bRow['email'] ?? '';
                $customerInfo['contact'] = $bRow['phone'] ?: ($bRow['email'] ?: 'No contact on record');
                $dates = [];
                if (!empty($bRow['pickup_date'])) $dates[] = $bRow['pickup_date'];
                if (!empty($bRow['drop_date'])) $dates[] = $bRow['drop_date'];
                if (empty($dates)) {
                    if (!empty($bRow['check_in_date'])) $dates[] = $bRow['check_in_date'];
                    if (!empty($bRow['check_out_date'])) $dates[] = $bRow['check_out_date'];
                }
                if (empty($dates)) {
                    if (!empty($bRow['departure_date'])) $dates[] = $bRow['departure_date'];
                    if (!empty($bRow['return_date'])) $dates[] = $bRow['return_date'];
                }
                $customerInfo['booking_dates'] = !empty($dates) ? implode(' to ', $dates) : 'Scheduled Dates';
                $customerInfo['service_name'] = $bRow['vehicle_name'] ?: ($bRow['hotel_name'] ?: ($bRow['package_name'] ?: ($bRow['item_name'] ?: 'Service')));
                $customerInfo['status'] = $bRow['status'] ?? 'Pending';
            }
        } catch (Exception $e) {}

        // 3. Fetch vendor details & recharge status
        $vendor = self::getVendorDetails($pdo, $vendorId);
        $rechargeStatus = 'Pending Recharge';
        try {
            $stmtTx = $pdo->prepare("SELECT status, amount, created_at FROM wallet_transactions WHERE vendor_id = ? AND type = 'credit' ORDER BY created_at DESC LIMIT 1");
            $stmtTx->execute([$vendorId]);
            $lastTx = $stmtTx->fetch(PDO::FETCH_ASSOC);
            if ($lastTx) {
                $rechargeStatus = "{$lastTx['status']} (₹" . number_format(floatval($lastTx['amount']), 2) . ") on " . substr($lastTx['created_at'], 0, 10);
            }
        } catch (Exception $e) {}

        $balNorm = floatval($currentBalance);
        if (abs($balNorm) < 0.001) $balNorm = 0.0;
        $formattedBal = ($balNorm < 0) ? "-₹" . number_format(abs($balNorm), 2) : "₹" . number_format($balNorm, 2);

        $vendorInfo = [
            'id' => $vendorId,
            'vendor_id' => $vendorId,
            'name' => $vendor['name'],
            'phone' => $vendor['phone'],
            'email' => $vendor['email'],
            'contact' => $vendor['phone'] ?: ($vendor['email'] ?: 'No contact on record'),
            'balance' => $balNorm,
            'wallet_balance' => $balNorm,
            'negative_booking_count' => $negativeCount,
            'max_negative_bookings' => $maxNegativeBookings,
            'block_reason' => "Wallet balance is negative ({$formattedBal}) and maximum negative booking limit reached ({$negativeCount}/{$maxNegativeBookings})",
            'recharge_status' => $rechargeStatus
        ];

        $bookingInfo = [
            'id' => $bookingId,
            'type' => $customerInfo['type'],
            'service_name' => $customerInfo['service_name'],
            'dates' => $customerInfo['booking_dates'],
            'status' => $customerInfo['status'],
            'neutral_status' => 'Pending Confirmation'
        ];

        $actions = [
            ['label' => 'CONTACT VENDOR', 'type' => 'contact_vendor', 'phone' => $vendor['phone'], 'email' => $vendor['email']],
            ['label' => 'CONTACT CUSTOMER', 'type' => 'contact_customer', 'phone' => $customerInfo['phone'], 'email' => $customerInfo['email']],
            ['label' => 'VIEW BOOKING', 'type' => 'view_booking', 'booking_id' => $bookingId]
        ];

        $payload = [
            'booking_id' => $bookingId,
            'related_booking_id' => $bookingId,
            'booking' => $bookingInfo,
            'customer' => $customerInfo,
            'vendor' => $vendorInfo,
            'wallet' => [
                'balance' => $balNorm,
                'negative_booking_count' => $negativeCount,
                'max_negative_bookings' => $maxNegativeBookings
            ],
            'actions' => $actions
        ];

        $alertId = "alert_blocked_{$bookingId}_" . uniqid();

        // 4. Create Operational Alert for Admin + Super Admin
        $adminTitle = "⚠ OPERATIONAL ALERT: Booking Blocked Due to Vendor Wallet (#{$bookingId})";
        $adminMsg = "Customer: {$customerInfo['name']} ({$customerInfo['contact']}) | Service: {$customerInfo['service_name']} | Vendor: {$vendor['name']} ({$vendorInfo['contact']}) | Balance: {$formattedBal} | Negative: {$negativeCount}/{$maxNegativeBookings}. Action required.";
        $metadataJson = json_encode($payload);

        // Notify Admin and Super Admin
        foreach (['admin', 'superadmin'] as $roleKey) {
            try {
                $stmtN = $pdo->prepare("
                    INSERT INTO notifications (
                        user_id, role, type, title, message, reference_type, reference_id, metadata_json, is_read, created_at
                    ) VALUES (?, ?, 'VENDOR_BOOKING_BLOCKED', ?, ?, 'booking_blocked', ?, ?, 0, CURRENT_TIMESTAMP)
                ");
                $stmtN->execute([$roleKey, $roleKey, $adminTitle, $adminMsg, $bookingId, $metadataJson]);
            } catch (Exception $e) {}
        }

        // 5. Notify Vendor immediately (neutral customer info, vendor financial info visible ONLY to vendor)
        $vendorTitle = "⚠ Action Required: Booking Confirmation Blocked";
        $vendorMsg = "Your confirmation for booking #{$bookingId} could not be completed because your wallet balance is {$formattedBal} and you have reached the maximum allowed negative bookings ({$negativeCount}/{$maxNegativeBookings}). Please recharge your vendor wallet immediately.";
        try {
            $stmtVN = $pdo->prepare("
                INSERT INTO notifications (
                    user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                ) VALUES (?, 'vendor', 'BOOKING_BLOCKED', ?, ?, 'booking_blocked', ?, 0, CURRENT_TIMESTAMP)
            ");
            $stmtVN->execute([$vendorId, $vendorTitle, $vendorMsg, $bookingId]);
        } catch (Exception $e) {}

        // 6. Dispatch across configured channels
        $settings = self::getEscalationSettings($pdo);
        $configuredChannels = $settings['channels'];

        $threshold = self::getMinimumWalletBalance($pdo);

        if (in_array('SMS', $configuredChannels)) {
            self::dispatchSmsChannel($pdo, $alertId, $vendorId, $vendor['phone'], $currentBalance, $threshold, $vendorMsg);
            // Tag audit log with event_type = BOOKING_BLOCKED
            $pdo->prepare("UPDATE vendor_wallet_alert_logs SET event_type = 'BOOKING_BLOCKED' WHERE alert_id = ? AND channel = 'SMS'")->execute([$alertId]);
        }
        if (in_array('Email', $configuredChannels)) {
            self::dispatchEmailChannel($pdo, $alertId, $vendorId, $vendor['email'], $vendor['name'], $currentBalance, $threshold, $vendorMsg);
            $pdo->prepare("UPDATE vendor_wallet_alert_logs SET event_type = 'BOOKING_BLOCKED' WHERE alert_id = ? AND channel = 'EMAIL'")->execute([$alertId]);
        }
        if (in_array('WhatsApp', $configuredChannels)) {
            self::dispatchWhatsAppChannel($pdo, $alertId, $vendorId, $vendor['phone'], $currentBalance, $threshold, $vendorMsg);
            $pdo->prepare("UPDATE vendor_wallet_alert_logs SET event_type = 'BOOKING_BLOCKED' WHERE alert_id = ? AND channel = 'WHATSAPP'")->execute([$alertId]);
        }
        if (in_array('Portal', $configuredChannels)) {
            self::recordAlertLog($pdo, [
                'id' => 'log_blocked_' . uniqid(),
                'alert_id' => $alertId,
                'vendor_id' => $vendorId,
                'channel' => 'PORTAL',
                'threshold' => $threshold,
                'wallet_balance' => $currentBalance,
                'status' => 'DELIVERED',
                'provider' => 'INTERNAL_PORTAL',
                'provider_message_id' => $bookingId,
                'recipient' => $vendorId,
                'error_message' => null,
                'payload_preview' => substr($adminMsg, 0, 255),
                'sent_at' => date('Y-m-d H:i:s'),
                'event_type' => 'BOOKING_BLOCKED'
            ]);
        }

        // 7. Update vendor_wallets tracking fields
        try {
            $stmtUpdW = $pdo->prepare("
                UPDATE vendor_wallets 
                SET last_blocked_booking_id = ?, last_reminder_at = CURRENT_TIMESTAMP, initial_reminders_sent = 0, suspension_decision_notified = 0 
                WHERE vendor_id = ?
            ");
            $stmtUpdW->execute([$bookingId, $vendorId]);
        } catch (Exception $e) {}

        return [
            'triggered' => true,
            'alert_id' => $alertId,
            'vendor_id' => $vendorId,
            'booking_id' => $bookingId,
            'balance' => $currentBalance
        ];
    }

    /**
     * Process due escalation reminders.
     * STOP after max_initial_reminders (default 2).
     * DO NOT automatically hide or suspend services!
     * Instead, notify Admin + Super Admin that manual decision is required.
     */
    public static function processDueEscalationReminders(PDO $pdo, bool $forceDueForTest = false): array {
        self::ensureSchema($pdo);
        $settings = self::getEscalationSettings($pdo);
        $freqHours = $settings['frequency_hours'];
        $maxReminders = $settings['max_initial_reminders'];
        $maxNeg = $settings['max_negative_bookings'];
        $channels = $settings['channels'];
        $threshold = self::getMinimumWalletBalance($pdo);

        $results = [
            'success' => true,
            'reminders_processed' => 0,
            'decisions_notified' => 0,
            'details' => []
        ];

        // Find blocked vendors whose services are not yet manually suspended
        $stmt = $pdo->prepare("
            SELECT * FROM vendor_wallets 
            WHERE balance < 0 AND negative_booking_count >= ? AND (services_suspended = 0 OR services_suspended IS NULL)
        ");
        $stmt->execute([$maxNeg]);
        $blockedWallets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($blockedWallets as $w) {
            $vendorId = $w['vendor_id'];
            $sentCount = intval($w['initial_reminders_sent'] ?? 0);
            $lastAt = $w['last_reminder_at'] ?? null;
            $decisionNotified = intval($w['suspension_decision_notified'] ?? 0);
            $balance = floatval($w['balance'] ?? 0);
            $vendor = self::getVendorDetails($pdo, $vendorId);
            $formattedBal = "-₹" . number_format(abs($balance), 2);

            if ($sentCount < $maxReminders) {
                // Check if due based on reminder frequency
                $isDue = false;
                if ($forceDueForTest || empty($lastAt)) {
                    $isDue = true;
                } else {
                    $diffSeconds = time() - strtotime($lastAt);
                    $thresholdSeconds = ($freqHours <= 0.02 && $freqHours > 0) ? 60 : intval($freqHours * 3600);
                    if ($diffSeconds >= $thresholdSeconds) {
                        $isDue = true;
                    }
                }

                if ($isDue) {
                    $nextSent = $sentCount + 1;
                    $eventType = ($nextSent === 1) ? 'REMINDER_1' : 'REMINDER_2';
                    $alertId = "alert_rem_{$nextSent}_{$vendorId}_" . uniqid();

                    $reminderMsg = "WOW GOA Reminder #{$nextSent}: Your vendor wallet balance is {$formattedBal}. Please recharge your vendor wallet to restore services and unblock booking confirmations.";

                    // Multi-channel dispatch
                    if (in_array('SMS', $channels)) {
                        self::dispatchSmsChannel($pdo, $alertId, $vendorId, $vendor['phone'], $balance, $threshold, $reminderMsg);
                        $pdo->prepare("UPDATE vendor_wallet_alert_logs SET event_type = ? WHERE alert_id = ? AND channel = 'SMS'")->execute([$eventType, $alertId]);
                    }
                    if (in_array('Email', $channels)) {
                        self::dispatchEmailChannel($pdo, $alertId, $vendorId, $vendor['email'], $vendor['name'], $balance, $threshold, $reminderMsg);
                        $pdo->prepare("UPDATE vendor_wallet_alert_logs SET event_type = ? WHERE alert_id = ? AND channel = 'EMAIL'")->execute([$eventType, $alertId]);
                    }
                    if (in_array('WhatsApp', $channels)) {
                        self::dispatchWhatsAppChannel($pdo, $alertId, $vendorId, $vendor['phone'], $balance, $threshold, $reminderMsg);
                        $pdo->prepare("UPDATE vendor_wallet_alert_logs SET event_type = ? WHERE alert_id = ? AND channel = 'WHATSAPP'")->execute([$eventType, $alertId]);
                    }
                    if (in_array('Portal', $channels)) {
                        self::recordAlertLog($pdo, [
                            'id' => 'log_rem_' . uniqid(),
                            'alert_id' => $alertId,
                            'vendor_id' => $vendorId,
                            'channel' => 'PORTAL',
                            'threshold' => $threshold,
                            'wallet_balance' => $balance,
                            'status' => 'DELIVERED',
                            'provider' => 'INTERNAL_PORTAL',
                            'provider_message_id' => (string)$nextSent,
                            'recipient' => $vendorId,
                            'error_message' => null,
                            'payload_preview' => substr($reminderMsg, 0, 255),
                            'sent_at' => date('Y-m-d H:i:s'),
                            'event_type' => $eventType
                        ]);
                    }

                    // Create in-portal notification for vendor
                    try {
                        $stmtNotif = $pdo->prepare("
                            INSERT INTO notifications (
                                user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                            ) VALUES (?, 'vendor', 'ESCALATION_REMINDER', ?, ?, 'wallet_reminder', ?, 0, CURRENT_TIMESTAMP)
                        ");
                        $stmtNotif->execute([$vendorId, "⚠ Urgent Reminder #{$nextSent}: Vendor Wallet Recharge Required", $reminderMsg, $alertId]);
                    } catch (Exception $e) {}

                    // Update vendor_wallets with incremented count & new timestamp
                    $pdo->prepare("UPDATE vendor_wallets SET initial_reminders_sent = ?, last_reminder_at = CURRENT_TIMESTAMP WHERE vendor_id = ?")
                        ->execute([$nextSent, $vendorId]);

                    $results['reminders_processed']++;
                    $results['details'][] = ['vendor_id' => $vendorId, 'action' => $eventType, 'count' => $nextSent];
                }
            } else {
                // STOP automatic reminders after maxReminders!
                // DO NOT automatically set services_suspended = 1.
                // Notify Admin and Super Admin once that a service suspension decision is required.
                if ($decisionNotified === 0) {
                    $adminTitle = "OPERATIONAL DECISION REQUIRED: Vendor Service Suspension";
                    $adminMsg = "Vendor '{$vendor['name']}' ({$vendorId}) has received all {$sentCount} automatic reminders and wallet remains negative ({$formattedBal}). Automatic reminders have stopped. Admin or Super Admin manual decision required to [HIDE SERVICES].";

                    foreach (['admin', 'superadmin'] as $roleKey) {
                        try {
                            $stmtDec = $pdo->prepare("
                                INSERT INTO notifications (
                                    user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                                ) VALUES (?, ?, 'VENDOR_SUSPENSION_DECISION_REQUIRED', ?, ?, 'vendor_suspension', ?, 0, CURRENT_TIMESTAMP)
                            ");
                            $stmtDec->execute([$roleKey, $roleKey, $adminTitle, $adminMsg, $vendorId]);
                        } catch (Exception $e) {}
                    }

                    $pdo->prepare("UPDATE vendor_wallets SET suspension_decision_notified = 1 WHERE vendor_id = ?")
                        ->execute([$vendorId]);

                    $results['decisions_notified']++;
                    $results['details'][] = ['vendor_id' => $vendorId, 'action' => 'DECISION_NOTIFIED', 'reminders_sent' => $sentCount];
                }
            }
        }

        return $results;
    }

    /**
     * Manually Suspend / Hide Vendor Services.
     * ONLY Admin or Super Admin can trigger this.
     */
    public static function suspendVendorServices(
        PDO $pdo,
        string $vendorId,
        string $actorId,
        string $reason = '',
        ?string $bookingId = null
    ): array {
        self::ensureSchema($pdo);
        $reason = trim($reason) ?: 'Manual service suspension due to unresolved negative wallet balance.';
        $vendor = self::getVendorDetails($pdo, $vendorId);

        // 1. Mark services_suspended = 1
        $stmt = $pdo->prepare("
            UPDATE vendor_wallets 
            SET services_suspended = 1, 
                suspended_at = CURRENT_TIMESTAMP, 
                suspension_reason = ?, 
                suspended_by = ? 
            WHERE vendor_id = ?
        ");
        $stmt->execute([$reason, $actorId, $vendorId]);

        // 2. Audit log
        $alertId = 'alert_suspend_' . uniqid();
        $balance = 0.00;
        try {
            $stmtW = $pdo->prepare("SELECT balance FROM vendor_wallets WHERE vendor_id = ?");
            $stmtW->execute([$vendorId]);
            $balance = floatval($stmtW->fetchColumn() ?: 0.00);
        } catch (Exception $e) {}

        self::recordAlertLog($pdo, [
            'id' => 'log_suspend_' . uniqid(),
            'alert_id' => $alertId,
            'vendor_id' => $vendorId,
            'channel' => 'PORTAL',
            'threshold' => self::getMinimumWalletBalance($pdo),
            'wallet_balance' => $balance,
            'status' => 'DELIVERED',
            'provider' => 'ADMIN_ACTION',
            'provider_message_id' => $actorId,
            'recipient' => $vendorId,
            'error_message' => null,
            'payload_preview' => substr("Services suspended by {$actorId}: {$reason}", 0, 255),
            'sent_at' => date('Y-m-d H:i:s'),
            'event_type' => 'SERVICES_SUSPENDED'
        ]);

        // 3. Notify Vendor (Account stays active for login & recharge!)
        try {
            $stmtNotif = $pdo->prepare("
                INSERT INTO notifications (
                    user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                ) VALUES (?, 'vendor', 'SERVICES_SUSPENDED', '⚠ NOTICE: Your Services Are Hidden from Public Listings', ?, 'service_suspension', ?, 0, CURRENT_TIMESTAMP)
            ");
            $stmtNotif->execute([
                $vendorId,
                "Your services have been hidden from public customer search. Reason: {$reason}. You may still access your portal, recharge your wallet, and submit a service reactivation request.",
                $vendorId
            ]);
        } catch (Exception $e) {}

        // 4. Notify Admin & Super Admin
        foreach (['admin', 'superadmin'] as $rk) {
            try {
                $stmtA = $pdo->prepare("
                    INSERT INTO notifications (
                        user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                    ) VALUES (?, ?, 'SERVICES_SUSPENDED_CONFIRM', 'Vendor Services Suspended', ?, 'vendor_suspension', ?, 0, CURRENT_TIMESTAMP)
                ");
                $stmtA->execute([
                    $rk, $rk,
                    "Services for vendor '{$vendor['name']}' ({$vendorId}) were hidden by {$actorId}. Reason: {$reason}",
                    $vendorId
                ]);
            } catch (Exception $e) {}
        }

        return [
            'success' => true,
            'services_suspended' => 1,
            'vendor_id' => $vendorId,
            'suspended_by' => $actorId,
            'suspension_reason' => $reason
        ];
    }

    /**
     * Submit Service Reactivation Request by Vendor.
     */
    public static function submitReactivationRequest(PDO $pdo, string $vendorId, string $message): array {
        self::ensureSchema($pdo);
        $message = trim($message);
        if (empty($message)) {
            return ['success' => false, 'error' => 'Please provide a message or reason for reactivation.'];
        }

        // Verify vendor exists and is suspended
        $stmtW = $pdo->prepare("SELECT services_suspended, balance FROM vendor_wallets WHERE vendor_id = ?");
        $stmtW->execute([$vendorId]);
        $w = $stmtW->fetch(PDO::FETCH_ASSOC);

        if (!$w || intval($w['services_suspended'] ?? 0) !== 1) {
            return ['success' => false, 'error' => 'Vendor services are not currently suspended.'];
        }

        // Set status to PENDING_REACTIVATION
        $stmtUpd = $pdo->prepare("
            UPDATE vendor_wallets 
            SET reactivation_status = 'PENDING_REACTIVATION', 
                reactivation_requested_at = CURRENT_TIMESTAMP, 
                reactivation_message = ?, 
                reactivation_rejection_reason = NULL 
            WHERE vendor_id = ?
        ");
        $stmtUpd->execute([$message, $vendorId]);

        $vendor = self::getVendorDetails($pdo, $vendorId);
        $bal = floatval($w['balance'] ?? 0.00);
        $formattedBal = ($bal < 0) ? "-₹" . number_format(abs($bal), 2) : "₹" . number_format($bal, 2);

        // Notify Admin + Super Admin
        $title = "Service Reactivation Request from {$vendor['name']}";
        $notifMsg = "Vendor '{$vendor['name']}' ({$vendorId}) submitted a reactivation request. Wallet balance: {$formattedBal}. Vendor message: '{$message}'. Review and decide in Reactivation Requests.";

        foreach (['admin', 'superadmin'] as $rk) {
            try {
                $stmtA = $pdo->prepare("
                    INSERT INTO notifications (
                        user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                    ) VALUES (?, ?, 'VENDOR_REACTIVATION_REQUEST', ?, ?, 'reactivation_request', ?, 0, CURRENT_TIMESTAMP)
                ");
                $stmtA->execute([$rk, $rk, $title, $notifMsg, $vendorId]);
            } catch (Exception $e) {}
        }

        return [
            'success' => true,
            'reactivation_status' => 'PENDING_REACTIVATION',
            'vendor_id' => $vendorId,
            'message' => 'Reactivation request submitted successfully. Awaiting Admin/Super Admin decision.'
        ];
    }

    /**
     * Handle Reactivation Decision (Approve or Reject).
     * If approved: services_suspended = 0, reactivation_status = APPROVED.
     * If rejected: services_suspended remains 1, reactivation_status = REJECTED, rejection reason MANDATORY.
     */
    public static function handleReactivationDecision(
        PDO $pdo,
        string $vendorId,
        string $actorId,
        string $decision,
        string $rejectionReason = ''
    ): array {
        self::ensureSchema($pdo);
        $decision = strtoupper(trim($decision));
        $rejectionReason = trim($rejectionReason);

        $vendor = self::getVendorDetails($pdo, $vendorId);

        if ($decision === 'APPROVED') {
            $stmt = $pdo->prepare("
                UPDATE vendor_wallets 
                SET services_suspended = 0, 
                    reactivation_status = 'APPROVED', 
                    suspended_at = NULL, 
                    suspension_reason = NULL, 
                    suspended_by = NULL, 
                    initial_reminders_sent = 0, 
                    suspension_decision_notified = 0 
                WHERE vendor_id = ?
            ");
            $stmt->execute([$vendorId]);

            // Notify Vendor
            try {
                $stmtV = $pdo->prepare("
                    INSERT INTO notifications (
                        user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                    ) VALUES (?, 'vendor', 'REACTIVATION_APPROVED', '🎉 Services Reactivated!', 'Your services have been approved and restored by administration. Your listings are now visible to customers again.', 'reactivation_decision', ?, 0, CURRENT_TIMESTAMP)
                ");
                $stmtV->execute([$vendorId, $vendorId]);
            } catch (Exception $e) {}

            // Notify Admins
            foreach (['admin', 'superadmin'] as $rk) {
                try {
                    $stmtA = $pdo->prepare("
                        INSERT INTO notifications (
                            user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                        ) VALUES (?, ?, 'REACTIVATION_DECISION_CONFIRM', 'Vendor Services Restored', ?, 'reactivation_decision', ?, 0, CURRENT_TIMESTAMP)
                    ");
                    $stmtA->execute([
                        $rk, $rk,
                        "Services for vendor '{$vendor['name']}' ({$vendorId}) have been APPROVED and RESTORED by {$actorId}.",
                        $vendorId
                    ]);
                } catch (Exception $e) {}
            }

            return [
                'success' => true,
                'services_suspended' => 0,
                'reactivation_status' => 'APPROVED',
                'vendor_id' => $vendorId
            ];
        } elseif ($decision === 'REJECTED') {
            if (empty($rejectionReason)) {
                return [
                    'success' => false,
                    'error' => 'Rejection reason is mandatory when rejecting a service reactivation request.'
                ];
            }

            // Services remain suspended (services_suspended remains 1)
            $stmt = $pdo->prepare("
                UPDATE vendor_wallets 
                SET services_suspended = 1, 
                    reactivation_status = 'REJECTED', 
                    reactivation_rejection_reason = ? 
                WHERE vendor_id = ?
            ");
            $stmt->execute([$rejectionReason, $vendorId]);

            // Notify Vendor with clear rejection reason
            try {
                $stmtV = $pdo->prepare("
                    INSERT INTO notifications (
                        user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                    ) VALUES (?, 'vendor', 'REACTIVATION_REJECTED', 'Service Reactivation Request Rejected', ?, 'reactivation_decision', ?, 0, CURRENT_TIMESTAMP)
                ");
                $stmtV->execute([
                    $vendorId,
                    "Your reactivation request was rejected. Reason: {$rejectionReason}. Your services remain hidden. You may resolve the issue and submit a new reactivation request.",
                    $vendorId
                ]);
            } catch (Exception $e) {}

            return [
                'success' => true,
                'services_suspended' => 1,
                'reactivation_status' => 'REJECTED',
                'rejection_reason' => $rejectionReason,
                'vendor_id' => $vendorId
            ];
        }

        return ['success' => false, 'error' => "Invalid decision '{$decision}'. Must be APPROVED or REJECTED."];
    }

    /**
     * Send Manual Post-Suspension Reminder.
     * Admin or Super Admin initiates this manually.
     */
    /**
     * Send Authoritative Manual Vendor Wallet Recharge Reminder.
     * Initiated specifically by Admin or Super Admin for a PARTICULAR vendor.
     * Operates for active, grace, blocked, and post-suspension states.
     * Does NOT increment automatic reminder counter (initial_reminders_sent).
     * Does NOT restart the automatic reminder cycle.
     * Does NOT modify services_suspended status.
     * Records MANUAL_REMINDER in vendor_wallet_alert_logs.
     */
    public static function sendManualVendorReminder(
        PDO $pdo,
        string $vendorId,
        string $actorId,
        $channels,
        string $customMessage = ''
    ): array {
        self::ensureSchema($pdo);
        $vendorId = trim($vendorId);
        if (empty($vendorId)) {
            return ['success' => false, 'error' => 'vendor_id is required.'];
        }

        // 1. Resolve vendor details
        $vendor = self::getVendorDetails($pdo, $vendorId);
        
        // Verify vendor exists in users, vendors, or vendor_wallets
        $stmtCheck = $pdo->prepare("
            SELECT 1 FROM vendor_wallets WHERE vendor_id = ?
            UNION
            SELECT 1 FROM users WHERE id = ? OR username = ?
            UNION
            SELECT 1 FROM vendors WHERE id = ?
            LIMIT 1
        ");
        $stmtCheck->execute([$vendorId, $vendorId, $vendorId, $vendorId]);
        if (!$stmtCheck->fetch()) {
            return ['success' => false, 'error' => "Vendor '{$vendorId}' does not exist."];
        }

        // 2. Resolve and normalize channels
        if (is_string($channels)) {
            $channels = array_filter(array_map('trim', explode(',', $channels)));
        }
        if (empty($channels) || !is_array($channels)) {
            return ['success' => false, 'error' => 'Please select at least one dispatch channel (SMS, WhatsApp, Email, or Portal).'];
        }

        // 3. Load wallet state
        $stmtW = $pdo->prepare("SELECT * FROM vendor_wallets WHERE vendor_id = ?");
        $stmtW->execute([$vendorId]);
        $wallet = $stmtW->fetch(PDO::FETCH_ASSOC);

        if (!$wallet) {
            $wallId = 'wall_' . uniqid();
            $pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, minimum_balance) VALUES (?, ?, 0, 0, 5000)")
                ->execute([$wallId, $vendorId]);
            $wallet = [
                'id' => $wallId,
                'vendor_id' => $vendorId,
                'balance' => 0.00,
                'negative_booking_count' => 0,
                'services_suspended' => 0,
                'initial_reminders_sent' => 0
            ];
        }

        $balance = floatval($wallet['balance'] ?? 0.00);
        if (abs($balance) < 0.001) $balance = 0.0;
        $threshold = self::getMinimumWalletBalance($pdo);
        $balAbs = abs($balance);
        $balFormattedVal = (floor($balAbs) == $balAbs) ? number_format($balAbs, 0) : number_format($balAbs, 2);
        $formattedBal = ($balance < 0) ? "-₹{$balFormattedVal}" : "₹{$balFormattedVal}";

        $negCount = intval($wallet['negative_booking_count'] ?? 0);
        $settings = self::getEscalationSettings($pdo);
        $maxLimit = intval($wallet['max_negative_booking_limit'] ?? ($settings['max_negative_bookings'] ?? 2));
        $isSuspended = intval($wallet['services_suspended'] ?? 0) === 1;
        $isBlocked = ($balance < 0 && $negCount >= $maxLimit);

        // 4. Validate contact details for selected channels
        foreach ($channels as $ch) {
            $chUpper = strtoupper(trim($ch));
            if (($chUpper === 'SMS' || $chUpper === 'WHATSAPP') && empty($vendor['phone'])) {
                return [
                    'success' => false, 
                    'error' => "Cannot dispatch via {$ch}: Vendor '{$vendor['name']}' does not have a phone number on record."
                ];
            }
            if ($chUpper === 'EMAIL' && empty($vendor['email'])) {
                return [
                    'success' => false, 
                    'error' => "Cannot dispatch via Email: Vendor '{$vendor['name']}' does not have an email address on record."
                ];
            }
        }

        // 5. Build dynamic message based on vendor operational status
        if ($isSuspended) {
            $defaultTemplate = "WOW GOA – Service Visibility Notice\n\nDear {Vendor Name}, your services are currently not visible to customers on the main WOW GOA website due to your wallet status.\n\nPlease recharge your vendor wallet and submit a Service Reactivation Request through your vendor portal.\n\nYour services will be restored after Admin/Super Admin approval.\n\n– WOW GOA";
        } elseif ($isBlocked) {
            $defaultTemplate = "WOW GOA – Urgent Wallet Recharge Reminder\n\nDear {Vendor Name}, your WOW GOA vendor wallet balance is ₹{Balance}.\nYour booking confirmation is currently restricted because your wallet has reached the allowed negative booking limit.\n\nPlease recharge your wallet through the vendor portal.\n\nIf the wallet issue is not resolved, the Admin may manually hide your services from the main WOW GOA website.\n\n– WOW GOA";
        } else {
            $defaultTemplate = "WOW GOA – Wallet Recharge Reminder\n\nDear {Vendor Name}, your WOW GOA vendor wallet balance is ₹{Balance}.\nPlease recharge your wallet to continue your services.\n\nIf the wallet issue is not resolved, your services may be hidden from the main WOW GOA website by the Admin.\n\n– WOW GOA";
        }

        $message = trim($customMessage);
        if (empty($message)) {
            $message = $defaultTemplate;
        }

        // Variable substitution
        $vName = $vendor['name'] ?: $vendorId;
        $message = str_replace(['{Vendor Name}', '{vendor_name}'], $vName, $message);

        if (strpos($message, '₹{Balance}') !== false) {
            $message = str_replace('₹{Balance}', $formattedBal, $message);
        }
        $rawBalStr = ($balance < 0) ? "-{$balFormattedVal}" : $balFormattedVal;
        $message = str_replace(
            ['{Balance}', '{balance}', '{wallet_balance}'],
            [$rawBalStr, $formattedBal, $formattedBal],
            $message
        );

        $alertId = 'alert_man_rem_' . uniqid();
        $channelResults = [];

        // 6. Dispatch across selected channels
        foreach ($channels as $ch) {
            $chUpper = strtoupper(trim($ch));
            if ($chUpper === 'SMS') {
                $smsRes = self::dispatchSmsChannel($pdo, $alertId, $vendorId, $vendor['phone'], $balance, $threshold, $message);
                $pdo->prepare("UPDATE vendor_wallet_alert_logs SET event_type = 'MANUAL_REMINDER' WHERE alert_id = ? AND channel = 'SMS'")->execute([$alertId]);
                $channelResults['SMS'] = [
                    'status' => $smsRes['status'],
                    'provider' => $smsRes['provider'] ?? 'SMS_GATEWAY_UNCONFIGURED',
                    'recipient' => $vendor['phone'],
                    'error' => $smsRes['error'] ?? null
                ];
            } elseif ($chUpper === 'EMAIL') {
                $emailRes = self::dispatchEmailChannel($pdo, $alertId, $vendorId, $vendor['email'], $vendor['name'], $balance, $threshold, $message);
                $pdo->prepare("UPDATE vendor_wallet_alert_logs SET event_type = 'MANUAL_REMINDER' WHERE alert_id = ? AND channel = 'EMAIL'")->execute([$alertId]);
                $channelResults['Email'] = [
                    'status' => $emailRes['status'],
                    'provider' => $emailRes['provider'] ?? 'EMAIL_GATEWAY_UNCONFIGURED',
                    'recipient' => $vendor['email'],
                    'error' => $emailRes['error'] ?? null
                ];
            } elseif ($chUpper === 'WHATSAPP') {
                $waRes = self::dispatchWhatsAppChannel($pdo, $alertId, $vendorId, $vendor['phone'], $balance, $threshold, $message);
                $pdo->prepare("UPDATE vendor_wallet_alert_logs SET event_type = 'MANUAL_REMINDER' WHERE alert_id = ? AND channel = 'WHATSAPP'")->execute([$alertId]);
                $channelResults['WhatsApp'] = [
                    'status' => $waRes['status'],
                    'provider' => $waRes['provider'] ?? 'WHATSAPP_GATEWAY_UNCONFIGURED',
                    'recipient' => $vendor['phone'],
                    'error' => $waRes['error'] ?? null
                ];
            } elseif ($chUpper === 'PORTAL') {
                self::recordAlertLog($pdo, [
                    'id' => 'log_man_' . uniqid(),
                    'alert_id' => $alertId,
                    'vendor_id' => $vendorId,
                    'channel' => 'PORTAL',
                    'threshold' => $threshold,
                    'wallet_balance' => $balance,
                    'status' => 'DELIVERED',
                    'provider' => 'INTERNAL_PORTAL',
                    'provider_message_id' => $actorId,
                    'recipient' => $vendorId,
                    'error_message' => null,
                    'payload_preview' => substr($message, 0, 255),
                    'sent_at' => date('Y-m-d H:i:s'),
                    'event_type' => 'MANUAL_REMINDER'
                ]);

                try {
                    $stmtNotif = $pdo->prepare("
                        INSERT INTO notifications (
                            user_id, role, type, title, message, reference_type, reference_id, is_read, created_at
                        ) VALUES (?, 'vendor', 'MANUAL_WALLET_RECHARGE_REMINDER', 'Notice from Administration: Wallet Recharge Required', ?, 'manual_reminder', ?, 0, CURRENT_TIMESTAMP)
                    ");
                    $stmtNotif->execute([$vendorId, $message, $alertId]);
                } catch (Exception $e) {}

                $channelResults['Portal'] = [
                    'status' => 'SENT',
                    'provider' => 'INTERNAL_PORTAL',
                    'recipient' => $vendorId,
                    'error' => null
                ];
            }
        }

        return [
            'success' => true,
            'vendor_id' => $vendorId,
            'vendor_name' => $vendor['name'],
            'sent_by' => $actorId,
            'channels' => $channels,
            'channels_dispatched' => count($channels),
            'channel_results' => $channelResults,
            'message' => $message,
            'wallet_balance' => $balance,
            'services_suspended' => intval($wallet['services_suspended'] ?? 0)
        ];
    }

    /**
     * Backward-compatible alias for sendManualVendorReminder.
     */
    public static function sendManualSuspensionReminder(
        PDO $pdo,
        string $vendorId,
        string $actorId,
        $channels,
        string $customMessage = ''
    ): array {
        return self::sendManualVendorReminder($pdo, $vendorId, $actorId, $channels, $customMessage);
    }

    /**
     * Get list of reactivation requests for Admin / Super Admin dashboard.
     */
    public static function getReactivationRequests(PDO $pdo): array {
        self::ensureSchema($pdo);
        try {
            $stmt = $pdo->query("
                SELECT 
                    w.vendor_id,
                    w.balance,
                    w.negative_booking_count,
                    w.services_suspended,
                    w.suspended_at,
                    w.suspension_reason,
                    w.suspended_by,
                    w.reactivation_status,
                    w.reactivation_requested_at,
                    w.reactivation_message,
                    w.reactivation_rejection_reason,
                    COALESCE(NULLIF(v.name, ''), NULLIF(u.name, ''), NULLIF(u.username, ''), w.vendor_id) AS vendor_name,
                    COALESCE(NULLIF(v.phone, ''), NULLIF(u.phone, '')) AS vendor_phone,
                    COALESCE(NULLIF(v.email, ''), NULLIF(u.email, '')) AS vendor_email
                FROM vendor_wallets w
                LEFT JOIN users u ON u.id = w.vendor_id OR u.username = w.vendor_id
                LEFT JOIN vendors v ON v.id = w.vendor_id
                WHERE w.reactivation_status IS NOT NULL OR w.services_suspended = 1
                ORDER BY 
                    CASE WHEN w.reactivation_status = 'PENDING_REACTIVATION' THEN 1 ELSE 2 END,
                    w.reactivation_requested_at DESC, 
                    w.suspended_at DESC
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch latest recharge status for each vendor
            foreach ($rows as &$r) {
                $vId = $r['vendor_id'];
                $stmtTx = $pdo->prepare("SELECT status, amount, created_at, reference_id FROM wallet_transactions WHERE vendor_id = ? AND type = 'credit' ORDER BY created_at DESC LIMIT 1");
                $stmtTx->execute([$vId]);
                $lastRecharge = $stmtTx->fetch(PDO::FETCH_ASSOC);
                $r['latest_recharge_status'] = $lastRecharge ? $lastRecharge['status'] : 'None';
                $r['latest_recharge_amount'] = $lastRecharge ? floatval($lastRecharge['amount']) : 0.00;
                $r['latest_recharge_date'] = $lastRecharge ? $lastRecharge['created_at'] : null;
                $r['latest_recharge_utr'] = $lastRecharge ? ($lastRecharge['reference_id'] ?? '') : '';
            }

            return $rows;
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Get list of blocked booking alerts with customer and vendor operational details.
    /**
     * Get list of blocked booking alerts with authoritative customer and vendor operational details.
     * Deduplicates multiple notifications for the same blocked booking event.
     * Enriches with real booking, customer, vendor, and wallet records.
     */
    public static function getBlockedBookingAlerts(PDO $pdo): array {
        self::ensureSchema($pdo);
        try {
            $stmt = $pdo->query("
                SELECT id, user_id, role, title, message, reference_id as booking_id, metadata_json, created_at, is_read 
                FROM notifications 
                WHERE type = 'VENDOR_BOOKING_BLOCKED' 
                ORDER BY created_at DESC LIMIT 150
            ");
            $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

            $results = [];
            $seenBookings = [];

            foreach ($rows as $r) {
                $bId = trim($r['booking_id'] ?? '');
                if (empty($bId)) continue;

                // Deduplicate: Exactly ONE operational alert card per blocked booking event
                if (isset($seenBookings[$bId])) {
                    continue;
                }
                $seenBookings[$bId] = true;

                $payload = [];
                if (!empty($r['metadata_json'])) {
                    $payload = json_decode($r['metadata_json'], true) ?: [];
                }

                // 1. Authoritative lookup from bookings table
                $bRow = null;
                try {
                    $stmtB = $pdo->prepare("SELECT * FROM bookings WHERE id = ? LIMIT 1");
                    $stmtB->execute([$bId]);
                    $bRow = $stmtB->fetch(PDO::FETCH_ASSOC);
                } catch (Exception $e) {}

                // 2. Customer resolution
                $custPayload = $payload['customer'] ?? [];
                $custName = '';
                if ($bRow && !empty(trim($bRow['name'] ?? ''))) {
                    $custName = trim($bRow['name']);
                } elseif (!empty(trim($custPayload['name'] ?? '')) && $custPayload['name'] !== 'Valued Customer') {
                    $custName = trim($custPayload['name']);
                } else {
                    $custName = 'Valued Customer';
                }

                $custPhone = $bRow['phone'] ?? ($custPayload['phone'] ?? ($custPayload['contact'] ?? ''));
                $custEmail = $bRow['email'] ?? ($custPayload['email'] ?? '');

                // 3. Dates & service resolution
                $dates = [];
                if ($bRow) {
                    if (!empty($bRow['pickup_date'])) $dates[] = $bRow['pickup_date'];
                    if (!empty($bRow['drop_date'])) $dates[] = $bRow['drop_date'];
                    if (empty($dates)) {
                        if (!empty($bRow['check_in_date'])) $dates[] = $bRow['check_in_date'];
                        if (!empty($bRow['check_out_date'])) $dates[] = $bRow['check_out_date'];
                    }
                    if (empty($dates)) {
                        if (!empty($bRow['departure_date'])) $dates[] = $bRow['departure_date'];
                        if (!empty($bRow['return_date'])) $dates[] = $bRow['return_date'];
                    }
                }
                $datesStr = !empty($dates) ? implode(' to ', $dates) : ($custPayload['booking_dates'] ?? ($payload['booking']['dates'] ?? 'Scheduled Dates'));
                $bType = $bRow['type'] ?? ($custPayload['type'] ?? ($payload['booking']['type'] ?? 'Vehicle'));
                
                $serviceName = '';
                if ($bRow) {
                    $serviceName = $bRow['vehicle_name'] ?: ($bRow['hotel_name'] ?: ($bRow['package_name'] ?: ($bRow['item_name'] ?: '')));
                }
                if (empty($serviceName)) {
                    $serviceName = $custPayload['service_name'] ?? ($payload['booking']['service_name'] ?? 'Booking Service');
                }

                $bStatus = $bRow['status'] ?? ($custPayload['status'] ?? 'Pending');

                // 4. Vendor resolution
                $vendPayload = $payload['vendor'] ?? [];
                $vendorId = ($bRow && !empty($bRow['vendor_id'])) ? $bRow['vendor_id'] : ($vendPayload['vendor_id'] ?? ($vendPayload['id'] ?? ''));
                
                $vendorDetails = !empty($vendorId) ? self::getVendorDetails($pdo, $vendorId) : ['id' => $vendorId, 'name' => $vendorId, 'phone' => '', 'email' => ''];
                $vendorName = $vendorDetails['name'] ?: ($vendPayload['name'] ?? $vendorId);
                $vendorPhone = $vendorDetails['phone'] ?: ($vendPayload['phone'] ?? ($vendPayload['contact'] ?? ''));
                $vendorEmail = $vendorDetails['email'] ?: ($vendPayload['email'] ?? '');

                // 5. Authoritative wallet state from vendor_wallets
                $walletRow = null;
                if (!empty($vendorId)) {
                    try {
                        $stmtW = $pdo->prepare("SELECT balance, negative_booking_count, services_suspended FROM vendor_wallets WHERE vendor_id = ? LIMIT 1");
                        $stmtW->execute([$vendorId]);
                        $walletRow = $stmtW->fetch(PDO::FETCH_ASSOC);
                    } catch (Exception $e) {}
                }

                $balance = $walletRow ? floatval($walletRow['balance'] ?? 0.00) : floatval($vendPayload['balance'] ?? ($vendPayload['wallet_balance'] ?? 0.00));
                if (abs($balance) < 0.001) $balance = 0.0;
                $negCount = $walletRow ? intval($walletRow['negative_booking_count'] ?? 0) : intval($vendPayload['negative_booking_count'] ?? 2);
                $settings = self::getEscalationSettings($pdo);
                $maxLimit = intval($settings['max_negative_bookings'] ?? ($vendPayload['max_negative_bookings'] ?? 2));

                $formattedBal = ($balance < 0) ? "-₹" . number_format(abs($balance), 2) : "₹" . number_format($balance, 2);

                // 6. Authoritative recharge status
                $rechargeStatus = $vendPayload['recharge_status'] ?? 'Pending Recharge';
                if (!empty($vendorId)) {
                    try {
                        $stmtTx = $pdo->prepare("SELECT status, amount, created_at FROM wallet_transactions WHERE vendor_id = ? AND type = 'credit' ORDER BY created_at DESC LIMIT 1");
                        $stmtTx->execute([$vendorId]);
                        $lastTx = $stmtTx->fetch(PDO::FETCH_ASSOC);
                        if ($lastTx) {
                            $rechargeStatus = "{$lastTx['status']} (₹" . number_format(floatval($lastTx['amount']), 2) . ") on " . substr($lastTx['created_at'], 0, 10);
                        }
                    } catch (Exception $e) {}
                }

                $blockReason = $vendPayload['block_reason'] ?? "Wallet balance is negative ({$formattedBal}) and maximum negative booking limit reached ({$negCount}/{$maxLimit})";

                $custObj = [
                    'booking_id' => $bId,
                    'type' => $bType,
                    'name' => $custName,
                    'phone' => $custPhone,
                    'email' => $custEmail,
                    'contact' => $custPhone ?: ($custEmail ?: 'N/A'),
                    'booking_dates' => $datesStr,
                    'service_name' => $serviceName,
                    'status' => $bStatus,
                    'neutral_status' => 'Pending Confirmation',
                    'blocked_at' => $r['created_at']
                ];

                $vendObj = [
                    'id' => $vendorId,
                    'vendor_id' => $vendorId,
                    'name' => $vendorName,
                    'phone' => $vendorPhone,
                    'email' => $vendorEmail,
                    'contact' => $vendorPhone ?: ($vendorEmail ?: 'N/A'),
                    'balance' => $balance,
                    'wallet_balance' => $balance,
                    'negative_booking_count' => $negCount,
                    'max_negative_bookings' => $maxLimit,
                    'block_reason' => $blockReason,
                    'recharge_status' => $rechargeStatus
                ];

                $bObj = [
                    'id' => $bId,
                    'type' => $bType,
                    'service_name' => $serviceName,
                    'dates' => $datesStr,
                    'status' => $bStatus,
                    'neutral_status' => 'Pending Confirmation'
                ];

                $walletObj = [
                    'balance' => $balance,
                    'negative_booking_count' => $negCount,
                    'max_negative_bookings' => $maxLimit
                ];

                $actions = [
                    ['label' => 'CONTACT VENDOR', 'type' => 'contact_vendor', 'phone' => $vendorPhone, 'email' => $vendorEmail],
                    ['label' => 'CONTACT CUSTOMER', 'type' => 'contact_customer', 'phone' => $custPhone, 'email' => $custEmail],
                    ['label' => 'VIEW BOOKING', 'type' => 'view_booking', 'booking_id' => $bId]
                ];

                $results[] = [
                    'id' => $r['id'],
                    'booking_id' => $bId,
                    'related_booking_id' => $bId,
                    'booking_type' => $bType,
                    'title' => $r['title'],
                    'message' => $r['message'],
                    'created_at' => $r['created_at'],
                    'blocked_at' => $r['created_at'],
                    'customer' => $custObj,
                    'vendor' => $vendObj,
                    'booking' => $bObj,
                    'wallet' => $walletObj,
                    'block_reason' => $blockReason,
                    'recharge_status' => $rechargeStatus,
                    'actions' => $actions,
                    'metadata' => [
                        'customer' => $custObj,
                        'vendor' => $vendObj,
                        'booking' => $bObj,
                        'wallet' => $walletObj,
                        'actions' => $actions
                    ]
                ];
            }
            return $results;
        } catch (Exception $e) {
            return [];
        }
    }
}

