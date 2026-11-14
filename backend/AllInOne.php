<?php
/**
 * ALL-IN-ONE SDK for PHP (plain PHP, Laravel, CodeIgniter, WordPress…). PHP 7.2+.
 * Zero dependencies. Never throws: if the hub is down, your app still works.
 *
 *   require_once 'AllInOne.php';
 *   $hub = new AllInOne('https://hub.yourcompany.com', 'aio_...');
 *
 *   // after password_verify(...) succeeds:
 *   $hub->trackLogin(['id' => $user['id'], 'email' => $user['email'], 'name' => $user['name']]);
 *
 *   // enquiry / contact form on your website -> ONLINE lead in the hub
 *   $hub->submitLead(['name' => $name, 'email' => $email, 'phone' => $phone, 'message' => $msg]);
 */
class AllInOne
{
    private $base;
    private $apiKey;
    private $timeout;
    private $debug;

    public function __construct(string $url, string $apiKey, float $timeoutSeconds = 2.0, bool $debug = false)
    {
        $this->base = rtrim($url, '/');
        $this->apiKey = $apiKey;
        $this->timeout = $timeoutSeconds;
        $this->debug = $debug;
    }

    public function trackLogin(array $user, array $meta = []): bool { return $this->track('login', $user, $meta); }
    public function trackLogout(array $user, array $meta = []): bool { return $this->track('logout', $user, $meta); }
    public function trackSignup(array $user, array $meta = []): bool { return $this->track('signup', $user, $meta); }
    public function trackFailedLogin(array $user, array $meta = []): bool { return $this->track('failed_login', $user, $meta); }

    /** @return bool true if the hub accepted the event */
    public function track(string $type, array $user = [], array $meta = []): bool
    {
        $body = [
            'type' => $type,
            'user' => [
                'id' => isset($user['id']) ? (string) $user['id'] : null,
                'email' => $user['email'] ?? null,
                'name' => $user['name'] ?? null,
            ],
            // Forward the END USER's IP and browser (not this server's)
            'ip' => self::clientIp(),
            'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        ];
        if (!empty($meta)) $body['meta'] = $meta;
        return $this->post('/v1/events', $body);
    }

    /**
     * Send an enquiry from your website/app (contact form, booking enquiry...).
     * It becomes an ONLINE lead in the hub that the admin assigns to a sales person.
     * Keys: name (required), email and/or phone (one required), company, message, source.
     */
    public function submitLead(array $lead): bool
    {
        $lead = array_filter($lead, function ($v) { return $v !== null && $v !== ''; });
        return $this->post('/v1/leads', $lead);
    }

    private function post(string $path, array $body): bool
    {
        $endpoint = $this->base . $path;
        $payload = json_encode($body);
        $headers = ['Content-Type: application/json', 'X-Api-Key: ' . $this->apiKey];

        try {
            if (function_exists('curl_init')) {
                $ch = curl_init($endpoint);
                curl_setopt_array($ch, [
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => $payload,
                    CURLOPT_HTTPHEADER => $headers,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT_MS => (int) ($this->timeout * 1000),
                    CURLOPT_CONNECTTIMEOUT_MS => (int) ($this->timeout * 1000),
                ]);
                $res = curl_exec($ch);
                $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
            } else {
                $ctx = stream_context_create(['http' => [
                    'method' => 'POST',
                    'header' => implode("\r\n", $headers),
                    'content' => $payload,
                    'timeout' => $this->timeout,
                    'ignore_errors' => true,
                ]]);
                $res = @file_get_contents($endpoint, false, $ctx);
                $code = 0;
                if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $code = (int) $m[1];
            }
            $ok = $code >= 200 && $code < 300;
            if (!$ok && $this->debug) error_log('[AllInOne] ' . $code . ' ' . $res);
            return $ok;
        } catch (\Throwable $e) {
            if ($this->debug) error_log('[AllInOne] ' . $e->getMessage());
            return false;
        }
    }

    private static function clientIp(): ?string
    {
        foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $k) {
            if (!empty($_SERVER[$k])) return trim(explode(',', $_SERVER[$k])[0]);
        }
        return null;
    }
}
