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
 *
 * Reliable delivery (automatic):
 *   - events are sent AFTER your page / JSON has gone to the visitor (LiteSpeed / PHP-FPM), so logins are never slowed
 *     down and the hub gets a longer timeout; one retry on network errors
 *   - if the hub cannot be reached, events wait in a small queue file and are sent with their ORIGINAL time later
 *
 * Device + exact location (automatic):
 *   - every browser gets a random id in the "aio_did" cookie, so two laptops on the same Wi-Fi are told apart
 *   - add <script src="https://hub.yourcompany.com/sdk/geo.js" defer></script> to your site's <head> and,
 *     when the person allows location in their browser, the hub shows their exact location (else the IP city)
 */
class AllInOne
{
    const VERSION = '2.0';
    const QUEUE_MAX_LINES = 500;

    private $base;
    private $apiKey;
    private $timeout;
    private $debug;
    private $defer;
    private $lastCode = 0;

    /** @var array<int, array{0: AllInOne, 1: string, 2: array}> events waiting for the end of the request */
    private static $pending = [];
    private static $shutdownRegistered = false;

    /**
     * @param float $timeoutSeconds timeout when sending immediately (deferred sends after the response use at least 6 s)
     * @param bool  $defer          send after the response has been delivered (recommended, default)
     */
    public function __construct(string $url, string $apiKey, float $timeoutSeconds = 2.0, bool $debug = false, bool $defer = true)
    {
        $this->base = rtrim($url, '/');
        $this->apiKey = $apiKey;
        $this->timeout = $timeoutSeconds;
        $this->debug = $debug;
        $this->defer = $defer;
    }

    public function trackLogin(array $user, array $meta = []): bool { return $this->track('login', $user, $meta); }
    public function trackLogout(array $user, array $meta = []): bool { return $this->track('logout', $user, $meta); }
    public function trackSignup(array $user, array $meta = []): bool { return $this->track('signup', $user, $meta); }
    public function trackFailedLogin(array $user, array $meta = []): bool { return $this->track('failed_login', $user, $meta); }

    /**
     * @param array $context optional overrides: ['deviceId' => '...', 'location' => ['lat' => .., 'lng' => .., 'accuracy' => ..]]
     * @return bool true if the event was accepted (or queued for sending at the end of this request)
     */
    public function track(string $type, array $user = [], array $meta = [], array $context = []): bool
    {
        try {
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
                // must run now (before any output) because it may set the device cookie
                'deviceId' => $context['deviceId'] ?? self::deviceId(),
                'at' => (int) round(microtime(true) * 1000),
            ];
            $location = $context['location'] ?? self::browserLocation();
            if ($location) $body['location'] = $location;
            if (!empty($meta)) $body['meta'] = $meta;
            return $this->send('/v1/events', $body);
        } catch (\Throwable $e) {
            if ($this->debug) error_log('[AllInOne] ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send an enquiry from your website/app (contact form, booking enquiry...).
     * It becomes an ONLINE lead in the hub that the admin assigns to a sales person.
     * Keys: name (required), email and/or phone (one required), company, message, source.
     * Sent immediately (you may want to show "thank you" only when it worked); queued for later if the hub is down.
     */
    public function submitLead(array $lead): bool
    {
        $lead = array_filter($lead, function ($v) { return $v !== null && $v !== ''; });
        return $this->deliver('/v1/leads', $lead, $this->timeout);
    }

    /** Check the connection (e.g. from a test page): returns ['ok' => bool, 'code' => http status, 'queued' => n]. */
    public function selfTest(): array
    {
        $this->post('/v1/events', ['type' => 'connection_test'], max($this->timeout, 5.0));
        // 400 = key accepted, the test event itself is rejected on purpose (nothing is saved)
        return ['ok' => $this->lastCode === 400, 'code' => $this->lastCode, 'queued' => $this->queueLength()];
    }

    // ------------------------------------------------------------------ delivery

    private function send(string $path, array $body): bool
    {
        if ($this->defer && PHP_SAPI !== 'cli') {
            self::$pending[] = [$this, $path, $body];
            if (!self::$shutdownRegistered) {
                self::$shutdownRegistered = true;
                register_shutdown_function([self::class, 'flushPending']);
            }
            return true;
        }
        return $this->deliver($path, $body, $this->timeout);
    }

    /** @internal runs at the end of the request */
    public static function flushPending(): void
    {
        if (!self::$pending) return;
        $jobs = self::$pending;
        self::$pending = [];
        // Hand the page / JSON to the visitor first, then talk to the hub
        $finished = false;
        try {
            if (function_exists('litespeed_finish_request')) $finished = (bool) @litespeed_finish_request();
            elseif (function_exists('fastcgi_finish_request')) $finished = (bool) @fastcgi_finish_request();
        } catch (\Throwable $e) {
        }
        @ignore_user_abort(true);
        foreach ($jobs as $job) {
            list($hub, $path, $body) = $job;
            // after the response is gone we can afford to wait longer for the hub
            $hub->deliver($path, $body, $finished ? max($hub->timeout, 6.0) : $hub->timeout, $finished);
        }
    }

    /** @param bool $retry try a second time on network errors (only when the visitor is no longer waiting) */
    private function deliver(string $path, array $body, float $timeout, bool $retry = false): bool
    {
        $ok = $this->post($path, $body, $timeout);
        if (!$ok && $retry && $this->retryable()) {
            usleep(400000);
            $ok = $this->post($path, $body, $timeout);
        }
        if ($ok) {
            $this->flushQueue($timeout);
            return true;
        }
        if ($this->retryable()) $this->enqueue($path, $body);
        return false;
    }

    /** network error, timeout, rate limit or hub error -> worth trying again later. Wrong key (401) / bad data (400) -> no. */
    private function retryable(): bool
    {
        return $this->lastCode === 0 || $this->lastCode === 429 || $this->lastCode >= 500;
    }

    private function post(string $path, array $body, float $timeout = 0): bool
    {
        $timeout = $timeout > 0 ? $timeout : $this->timeout;
        $endpoint = $this->base . $path;
        $payload = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        $headers = ['Content-Type: application/json', 'X-Api-Key: ' . $this->apiKey, 'User-Agent: allinone-php/' . self::VERSION];
        $this->lastCode = 0;
        $res = '';

        try {
            if (function_exists('curl_init')) {
                $ch = curl_init($endpoint);
                curl_setopt_array($ch, [
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => $payload,
                    CURLOPT_HTTPHEADER => $headers,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT_MS => (int) ($timeout * 1000),
                    CURLOPT_CONNECTTIMEOUT_MS => (int) (min($timeout, 5.0) * 1000),
                    CURLOPT_NOSIGNAL => true,
                ]);
                $res = curl_exec($ch);
                $this->lastCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
                if ($res === false && $this->debug) error_log('[AllInOne] ' . curl_error($ch));
                curl_close($ch);
            } else {
                $ctx = stream_context_create(['http' => [
                    'method' => 'POST',
                    'header' => implode("\r\n", $headers),
                    'content' => $payload,
                    'timeout' => $timeout,
                    'ignore_errors' => true,
                ]]);
                $res = @file_get_contents($endpoint, false, $ctx);
                if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $this->lastCode = (int) $m[1];
            }
            $ok = $this->lastCode >= 200 && $this->lastCode < 300;
            if (!$ok && $this->debug) error_log('[AllInOne] ' . $path . ' -> HTTP ' . $this->lastCode . ' ' . substr((string) $res, 0, 300));
            return $ok;
        } catch (\Throwable $e) {
            if ($this->debug) error_log('[AllInOne] ' . $e->getMessage());
            return false;
        }
    }

    // ------------------------------------------------------------------ offline queue (events keep their original time)

    private function queueFile(): string
    {
        return rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'allinone_queue_' . substr(md5($this->base . '|' . $this->apiKey), 0, 12) . '.jsonl';
    }

    private function queueLength(): int
    {
        $f = $this->queueFile();
        return is_file($f) ? count(file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: []) : 0;
    }

    private function enqueue(string $path, array $body): void
    {
        try {
            $f = $this->queueFile();
            $fh = @fopen($f, 'c+');
            if (!$fh) return;
            if (flock($fh, LOCK_EX)) {
                $lines = array_filter(explode("\n", stream_get_contents($fh)));
                $lines[] = json_encode(['path' => $path, 'body' => $body], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
                $lines = array_slice($lines, -self::QUEUE_MAX_LINES);
                ftruncate($fh, 0);
                rewind($fh);
                fwrite($fh, implode("\n", $lines) . "\n");
                fflush($fh);
                flock($fh, LOCK_UN);
            }
            fclose($fh);
        } catch (\Throwable $e) {
        }
    }

    /** The hub answered again: send up to 25 waiting events. */
    private function flushQueue(float $timeout): void
    {
        try {
            $f = $this->queueFile();
            if (!is_file($f) || filesize($f) === 0) return;
            $fh = @fopen($f, 'c+');
            if (!$fh) return;
            if (!flock($fh, LOCK_EX | LOCK_NB)) { // another request is already sending them
                fclose($fh);
                return;
            }
            $lines = array_values(array_filter(explode("\n", stream_get_contents($fh))));
            $keep = [];
            foreach ($lines as $i => $line) {
                $job = json_decode($line, true);
                if (!is_array($job) || empty($job['path']) || !is_array($job['body'] ?? null)) continue;
                if ($i >= 25 || !$this->post($job['path'], $job['body'], $timeout)) {
                    if ($i < 25 && !$this->retryable()) continue; // rejected for good (e.g. key changed): drop it
                    $keep[] = $line;
                }
            }
            ftruncate($fh, 0);
            rewind($fh);
            if ($keep) fwrite($fh, implode("\n", $keep) . "\n");
            fflush($fh);
            flock($fh, LOCK_UN);
            fclose($fh);
        } catch (\Throwable $e) {
        }
    }

    // ------------------------------------------------------------------ who / where

    /** Random id for this browser (cookie "aio_did", 2 years). Created here if geo.js has not made one yet. */
    private static function deviceId(): ?string
    {
        $id = $_COOKIE['aio_did'] ?? '';
        if (is_string($id) && preg_match('/^[A-Za-z0-9_-]{6,64}$/', $id)) return $id;
        if (PHP_SAPI === 'cli') return null;
        try {
            $id = bin2hex(random_bytes(12));
        } catch (\Throwable $e) {
            return null;
        }
        if (!headers_sent()) {
            $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
            header('Set-Cookie: aio_did=' . $id . '; Max-Age=' . (730 * 86400) . '; Path=/; SameSite=Lax' . ($https ? '; Secure' : ''), false);
        }
        $_COOKIE['aio_did'] = $id;
        return $id;
    }

    /** Exact position saved by geo.js (cookie "aio_geo" = lat,lng,accuracy,timeMs) - only exists if the person allowed it. */
    private static function browserLocation(): ?array
    {
        $raw = $_COOKIE['aio_geo'] ?? '';
        $parts = explode(',', is_string($raw) ? rawurldecode($raw) : '');
        if (count($parts) < 2 || !is_numeric($parts[0]) || !is_numeric($parts[1])) return null;
        $loc = ['lat' => (float) $parts[0], 'lng' => (float) $parts[1]];
        if (isset($parts[2]) && is_numeric($parts[2])) $loc['accuracy'] = (float) $parts[2];
        if (isset($parts[3]) && is_numeric($parts[3])) $loc['at'] = (float) $parts[3];
        return $loc;
    }

    private static function clientIp(): ?string
    {
        foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $k) {
            if (!empty($_SERVER[$k])) return trim(explode(',', $_SERVER[$k])[0]);
        }
        return null;
    }
}
