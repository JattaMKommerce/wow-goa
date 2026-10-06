<?php
// backend/config.php

/**
 * Simple .env parser to load environment variables.
 */
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Load the .env file
loadEnv(__DIR__ . '/.env');

// Expose constants for easy access
define('DUFFEL_ACCESS_TOKEN', $_ENV['DUFFEL_ACCESS_TOKEN'] ?? '');
define('DUFFEL_API_BASE_URL', $_ENV['DUFFEL_API_BASE_URL'] ?? 'https://api.duffel.com');
define('DUFFEL_API_VERSION', $_ENV['DUFFEL_API_VERSION'] ?? 'v2');
define('DUFFEL_MODE', $_ENV['DUFFEL_MODE'] ?? 'test');

if (!defined('DB_CONNECTION')) define('DB_CONNECTION', $_ENV['DB_CONNECTION'] ?? getenv('DB_CONNECTION') ?: 'sqlite');
if (!defined('DB_HOST')) define('DB_HOST', $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_PORT')) define('DB_PORT', $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306');
if (!defined('DB_NAME')) define('DB_NAME', $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'tripgalileo');
if (!defined('DB_USER')) define('DB_USER', $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root');
if (!defined('DB_PASS')) define('DB_PASS', $_ENV['DB_PASS'] ?? (getenv('DB_PASS') !== false ? getenv('DB_PASS') : ''));

// Ensure backend timezone is strictly UTC for consistent storage and serialization
if (!date_default_timezone_get() || date_default_timezone_get() !== 'UTC') {
    date_default_timezone_set('UTC');
}

/**
 * Format notification timestamp into standard ISO-8601 UTC string (e.g. 2026-10-01T12:17:00.000Z).
 * Interprets database timestamps (stored in UTC) as UTC and appends explicit 'Z' timezone.
 */
function formatNotificationTimestampUtc($ts) {
    if (empty($ts) || $ts === 'Recent' || $ts === 'Just now' || $ts === 'just now') {
        return $ts;
    }
    try {
        $str = trim((string)$ts);
        // If string does not contain an explicit timezone offset or Z, interpret as UTC
        if (!preg_match('/(Z|[+-]\d{2}:?\d{2})$/i', $str)) {
            $dt = new DateTime($str, new DateTimeZone('UTC'));
        } else {
            $dt = new DateTime($str);
        }
        $dt->setTimezone(new DateTimeZone('UTC'));
        return $dt->format('Y-m-d\TH:i:s.000\Z');
    } catch (Exception $e) {
        return $ts;
    }
}

/**
 * Normalizes notification row to ensure timestamp is an explicit ISO-8601 UTC string.
 */
function normalizeNotificationRow($row) {
    if (!is_array($row)) return $row;
    if (isset($row['created_at']) && !empty($row['created_at'])) {
        $row['created_at'] = formatNotificationTimestampUtc($row['created_at']);
    }
    if (isset($row['time']) && !empty($row['time'])) {
        $row['time'] = formatNotificationTimestampUtc($row['time']);
    }
    return $row;
}

/**
 * Normalizes a list of notification rows.
 */
function normalizeNotificationsList($list) {
    if (!is_array($list)) return [];
    return array_map('normalizeNotificationRow', $list);
}


