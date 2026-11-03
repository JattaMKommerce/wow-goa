<?php
/**
 * MailerService.php
 * Lightweight, robust SMTP mailer for WOW GOA.
 * Sends emails directly via Gmail SMTP (or any configured SMTP server)
 * without external Composer dependencies.
 */

function loadEnvSmtpConfig() {
    static $config = null;
    if ($config !== null) return $config;

    $config = [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'user' => 'raj.jattamkommerce@gmail.com',
        'pass' => 'tiveswdmwvgiflbn',
        'from' => 'raj.jattamkommerce@gmail.com',
        'from_name' => 'WOW GOA'
    ];

    $envPath = __DIR__ . '/.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (!$line || $line[0] === '#') continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val, " \t\n\r\0\x0B\"'");
                if ($key === 'SMTP_HOST') $config['host'] = $val;
                if ($key === 'SMTP_PORT') $config['port'] = (int)$val;
                if ($key === 'SMTP_USER') $config['user'] = $val;
                if ($key === 'SMTP_PASS') $config['pass'] = str_replace(' ', '', $val);
                if ($key === 'SMTP_FROM') $config['from'] = $val;
                if ($key === 'SMTP_FROM_NAME') $config['from_name'] = $val;
            }
        }
    }

    return $config;
}

/**
 * Send an email via SMTP.
 * Returns ['success' => true] or ['success' => false, 'error' => '...']
 */
function sendSmtpEmail($toEmail, $subject, $htmlContent, $textFallback = '') {
    $cfg = loadEnvSmtpConfig();
    $host = $cfg['host'];
    $port = (int)$cfg['port'];
    $user = $cfg['user'];
    $pass = $cfg['pass'];
    $from = $cfg['from'];
    $fromName = $cfg['from_name'];

    // Try port 587 (TLS) first, then port 465 (SSL)
    $attempts = [
        ['host' => $host, 'port' => 587, 'tls' => true, 'ssl' => false],
        ['host' => $host, 'port' => 465, 'tls' => false, 'ssl' => true]
    ];

    $lastError = 'Unknown SMTP error';

    foreach ($attempts as $conn) {
        $result = smtpSendInternal(
            $conn['host'],
            $conn['port'],
            $conn['tls'],
            $conn['ssl'],
            $user,
            $pass,
            $from,
            $fromName,
            $toEmail,
            $subject,
            $htmlContent,
            $textFallback
        );

        if ($result['success']) {
            return $result;
        } else {
            $lastError = $result['error'];
        }
    }

    return ['success' => false, 'error' => $lastError];
}

function smtpSendInternal($host, $port, $isTls, $isSsl, $user, $pass, $from, $fromName, $to, $subject, $html, $textFallback) {
    $timeout = 4;
    $errno = 0;
    $errstr = '';

    $remote = ($isSsl ? "ssl://" : "tcp://") . $host . ":" . $port;
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        return ['success' => false, 'error' => "Connection to $remote failed: $errstr ($errno)"];
    }

    stream_set_timeout($socket, $timeout);

    $getResponse = function() use ($socket) {
        $response = "";
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == " ") break;
        }
        return $response;
    };

    $sendCommand = function($cmd, $expectedCode = 250) use ($socket, $getResponse) {
        fputs($socket, $cmd . "\r\n");
        $resp = $getResponse();
        $code = (int)substr($resp, 0, 3);
        if ($expectedCode && $code !== $expectedCode) {
            return ['ok' => false, 'code' => $code, 'resp' => trim($resp)];
        }
        return ['ok' => true, 'code' => $code, 'resp' => trim($resp)];
    };

    // Greeting
    $greet = $getResponse();
    if (substr($greet, 0, 3) != "220") {
        fclose($socket);
        return ['success' => false, 'error' => "SMTP greeting failed: " . trim($greet)];
    }

    // EHLO
    $ehlo = $sendCommand("EHLO localhost");
    if (!$ehlo['ok']) {
        fclose($socket);
        return ['success' => false, 'error' => "EHLO failed: " . $ehlo['resp']];
    }

    // STARTTLS if on port 587
    if ($isTls) {
        $tlsRes = $sendCommand("STARTTLS", 220);
        if (!$tlsRes['ok']) {
            fclose($socket);
            return ['success' => false, 'error' => "STARTTLS failed: " . $tlsRes['resp']];
        }

        $cryptoOk = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if (!$cryptoOk) {
            fclose($socket);
            return ['success' => false, 'error' => "TLS handshake failed."];
        }

        // Re-EHLO after TLS
        $reEhlo = $sendCommand("EHLO localhost");
        if (!$reEhlo['ok']) {
            fclose($socket);
            return ['success' => false, 'error' => "Post-TLS EHLO failed: " . $reEhlo['resp']];
        }
    }

    // AUTH LOGIN
    $authReq = $sendCommand("AUTH LOGIN", 334);
    if (!$authReq['ok']) {
        fclose($socket);
        return ['success' => false, 'error' => "AUTH LOGIN command failed: " . $authReq['resp']];
    }

    $uRes = $sendCommand(base64_encode($user), 334);
    if (!$uRes['ok']) {
        fclose($socket);
        return ['success' => false, 'error' => "SMTP Username rejected: " . $uRes['resp']];
    }

    $pRes = $sendCommand(base64_encode($pass), 235);
    if (!$pRes['ok']) {
        fclose($socket);
        return ['success' => false, 'error' => "SMTP Password rejected: " . $pRes['resp']];
    }

    // MAIL FROM
    $fromRes = $sendCommand("MAIL FROM: <$from>", 250);
    if (!$fromRes['ok']) {
        fclose($socket);
        return ['success' => false, 'error' => "MAIL FROM rejected: " . $fromRes['resp']];
    }

    // RCPT TO
    $rcptRes = $sendCommand("RCPT TO: <$to>", 250);
    if (!$rcptRes['ok']) {
        fclose($socket);
        return ['success' => false, 'error' => "RCPT TO rejected for $to: " . $rcptRes['resp']];
    }

    // DATA
    $dataRes = $sendCommand("DATA", 354);
    if (!$dataRes['ok']) {
        fclose($socket);
        return ['success' => false, 'error' => "DATA command rejected: " . $dataRes['resp']];
    }

    // Compose message
    $boundary = "bnd_" . md5(uniqid(time()));
    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $encodedFromName = "=?UTF-8?B?" . base64_encode($fromName) . "?=";

    $headers = [
        "From: $encodedFromName <$from>",
        "To: <$to>",
        "Date: " . date('r'),
        "Subject: $encodedSubject",
        "MIME-Version: 1.0",
        "Content-Type: multipart/alternative; boundary=\"$boundary\"",
        "X-Mailer: WOW GOA Mailer/2026"
    ];

    $body = implode("\r\n", $headers) . "\r\n\r\n";

    // Text part
    $plain = $textFallback ?: strip_tags($html);
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($plain)) . "\r\n";

    // HTML part
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($html)) . "\r\n";

    $body .= "--$boundary--\r\n";
    $body .= ".";

    fputs($socket, $body . "\r\n");
    $sendResp = $getResponse();
    $sendCode = (int)substr($sendResp, 0, 3);

    $sendCommand("QUIT", 221);
    fclose($socket);

    if ($sendCode === 250) {
        return ['success' => true, 'message' => 'Email sent successfully via Gmail SMTP'];
    }

    return ['success' => false, 'error' => "Message rejected by SMTP: " . trim($sendResp)];
}

/**
 * Send Customer Portal / Login OTP Email with high-conversion WOW GOA styling.
 */
function sendCustomerLoginOtpEmail($toEmail, $otpCode, $customerName = 'Traveler') {
    $subject = "$otpCode is your WOW GOA Login Verification Code";
    
    $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
  .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .header { background: linear-gradient(135deg, #0B192C 0%, #1e3a5f 100%); padding: 30px 24px; text-align: center; }
  .logo-text { font-size: 26px; font-weight: 900; color: #FF6333; letter-spacing: 1px; margin: 0; }
  .tagline { color: #cbd5e1; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .content { padding: 32px 28px; text-align: center; }
  .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .desc { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
  .otp-box { background: #fff7ed; border: 2px dashed #ffedd5; border-radius: 12px; padding: 20px; margin: 0 auto 24px auto; display: inline-block; min-width: 240px; }
  .otp-code { font-size: 38px; font-weight: 900; color: #ea580c; letter-spacing: 8px; font-family: monospace; }
  .expiry-badge { font-size: 12px; color: #b45309; font-weight: 600; margin-top: 6px; }
  .security-note { font-size: 12px; color: #94a3b8; background: #f8fafc; border-radius: 8px; padding: 12px; text-align: left; line-height: 1.5; }
  .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo-text">WOW GOA</div>
    <div class="tagline">Official Trip &amp; Rental Verification</div>
  </div>
  <div class="content">
    <div class="greeting">Hello, $customerName!</div>
    <div class="desc">You requested a one-time verification code to access your WOW GOA customer booking portal and live trip manager.</div>
    <div class="otp-box">
      <div class="otp-code">$otpCode</div>
      <div class="expiry-badge">⏱️ Valid for 10 minutes only</div>
    </div>
    <div class="security-note">
      <strong>🔒 Security Notice:</strong> Never share this code with anyone. WOW GOA support staff will never ask for your verification code. If you did not make this request, you can safely ignore this email.
    </div>
  </div>
  <div class="footer">
    © 2026 WOW GOA • Goa Airport (Mopa &amp; Dabolim) • Self-Drive Fleet &amp; Holiday Experiences
  </div>
</div>
</body>
</html>
HTML;

    return sendSmtpEmail($toEmail, $subject, $html);
}

/**
 * Send Tourist Visa Application Confirmation Email.
 * Contains all the information submitted by the applicant with a polite thank-you message.
 */
function sendVisaApplicationConfirmationEmail($toEmail, $data = []) {
    $ref = htmlspecialchars($data['reference'] ?? $data['id'] ?? 'VISA-' . strtoupper(substr(md5(time()), 0, 8)));
    $fullName = htmlspecialchars($data['fullName'] ?? $data['name'] ?? 'Valued Traveler');
    $nationality = htmlspecialchars($data['nationality'] ?? 'Not specified');
    $flag = $data['flag'] ?? '🌐';
    $visaType = htmlspecialchars($data['visaType'] ?? $data['service'] ?? 'Tourist Visa');
    $passportNo = htmlspecialchars($data['passportNumber'] ?? 'Pending');
    $passportExpiry = htmlspecialchars($data['passportExpiry'] ?? 'Not specified');
    $arrivalDate = htmlspecialchars($data['arrivalDate'] ?? 'Not specified');
    $phone = htmlspecialchars($data['phone'] ?? 'Not specified');
    $email = htmlspecialchars($toEmail);
    $docs = !empty($data['documents']) 
        ? (is_array($data['documents']) ? implode(', ', array_map('htmlspecialchars', $data['documents'])) : htmlspecialchars($data['documents']))
        : 'Uploaded via portal';
    $submittedAt = date('d M Y, h:i A');

    $subject = "Application Received: Tourist Visa Request #$ref";

    $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 28px; text-align: center; }
  .header-badge { display: inline-block; background: rgba(234, 88, 12, 0.18); color: #ea580c; border: 1px solid rgba(234, 88, 12, 0.35); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; }
  .header h1 { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 6px 0; }
  .header p { color: #94a3b8; font-size: 13.5px; margin: 0; }
  .body { padding: 32px 28px; }
  .greeting { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
  .intro { font-size: 14.5px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
  .ref-card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ea580c; border-radius: 10px; padding: 14px 18px; margin-bottom: 26px; }
  .ref-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 2px; }
  .ref-val { font-size: 18px; font-weight: 800; color: #0f172a; font-family: monospace; }
  .ref-date { font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .details-title { font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
  .details-table { width: 100%; border-collapse: collapse; margin-bottom: 26px; }
  .details-table tr { border-bottom: 1px solid #f1f5f9; }
  .details-table td { padding: 10px 6px; font-size: 13.5px; vertical-align: top; }
  .details-table td.label { color: #64748b; width: 42%; font-weight: 600; }
  .details-table td.value { color: #0f172a; font-weight: 700; width: 58%; text-align: right; }
  .next-steps { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
  .next-steps h4 { margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: #c2410c; }
  .next-steps p { margin: 0; font-size: 13px; color: #9a3412; line-height: 1.55; }
  .contact-box { background: #f1f5f9; border-radius: 10px; padding: 14px 18px; text-align: center; font-size: 12.5px; color: #475569; margin-bottom: 20px; line-height: 1.5; }
  .footer { background: #0f172a; padding: 22px; text-align: center; font-size: 11.5px; color: #94a3b8; }
  .footer a { color: #ea580c; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-badge">Application Confirmation</div>
    <h1>Tourist Visa Application</h1>
    <p>Thank you for submitting your travel details</p>
  </div>
  
  <div class="body">
    <div class="greeting">Dear $fullName,</div>
    <div class="intro">
      Thank you for applying for tourist visa assistance with us! We have received your application and documents. Below is a full copy of the information you submitted for your records:
    </div>

    <div class="ref-card">
      <div class="ref-label">Application Reference ID</div>
      <div class="ref-val">#$ref</div>
      <div class="ref-date">Submitted on: $submittedAt</div>
    </div>

    <div class="details-title">Application Summary</div>
    <table class="details-table">
      <tr>
        <td class="label">Full Name</td>
        <td class="value">$fullName</td>
      </tr>
      <tr>
        <td class="label">Country / Nationality</td>
        <td class="value">$flag $nationality</td>
      </tr>
      <tr>
        <td class="label">Visa Duration / Type</td>
        <td class="value">$visaType</td>
      </tr>
      <tr>
        <td class="label">Passport Number</td>
        <td class="value">$passportNo</td>
      </tr>
      <tr>
        <td class="label">Passport Expiry Date</td>
        <td class="value">$passportExpiry</td>
      </tr>
      <tr>
        <td class="label">Date of Arrival</td>
        <td class="value">$arrivalDate</td>
      </tr>
      <tr>
        <td class="label">Contact Phone</td>
        <td class="value">$phone</td>
      </tr>
      <tr>
        <td class="label">Registered Email</td>
        <td class="value">$email</td>
      </tr>
      <tr>
        <td class="label">Uploaded Documents</td>
        <td class="value">$docs</td>
      </tr>
    </table>

    <div class="next-steps">
      <h4>📋 What Happens Next?</h4>
      <p>Our visa processing team will review your application and uploaded documents. If any further information or clarification is needed, we will contact you directly at <strong>$email</strong> or <strong>$phone</strong>.</p>
    </div>

    <div class="contact-box">
      Need to make changes or have questions? Simply reply to this email or reach out with your Reference Number <strong>#$ref</strong>.
    </div>
  </div>

  <div class="footer">
    © 2026 WOW GOA • Concierge, Tourist Visa &amp; Mobility Solutions<br>
    Questions? Contact support at <a href="mailto:raj.jattamkommerce@gmail.com">raj.jattamkommerce@gmail.com</a>
  </div>
</div>
</body>
</html>
HTML;

    return sendSmtpEmail($toEmail, $subject, $html);
}
