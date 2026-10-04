<?php

namespace App\Config;

/**
 * SortConfig
 * 
 * Centralized ordering rules and strict whitelist validator for all list endpoints.
 * Guarantees deterministic server-side sorting with primary key tie-breakers.
 */
class SortConfig {
    // Default ordering constants
    public const APPOINTMENTS_ADMIN = "a.created_at DESC, a.id DESC";
    public const APPOINTMENTS_DOCTOR_REQUESTS = "a.created_at DESC, a.id DESC";
    public const APPOINTMENTS_DOCTOR_UPCOMING = "a.appointment_date ASC, a.start_time ASC, a.id ASC";
    public const APPOINTMENTS_DOCTOR_HISTORY = "a.appointment_date DESC, a.start_time DESC, a.id DESC";
    public const APPOINTMENTS_PATIENT_UPCOMING = "a.appointment_date ASC, a.start_time ASC, a.id ASC";
    public const APPOINTMENTS_PATIENT_HISTORY = "a.appointment_date DESC, a.start_time DESC, a.id DESC";
    public const APPOINTMENTS_PATIENT_ALL = "a.appointment_date DESC, a.start_time DESC, a.id DESC";
    public const APPOINTMENTS_RECENT = "a.created_at DESC, a.id DESC";
    public const ADMIN_DOCTORS = "u.created_at DESC, u.id DESC";
    public const ADMIN_PATIENTS = "u.created_at DESC, u.id DESC";
    public const ADMIN_DEPARTMENTS = "d.created_at DESC, d.id DESC";
    public const PUBLIC_DEPARTMENTS = "d.name ASC, d.id ASC";
    public const PUBLIC_DOCTORS = "COALESCE(fb.rating_avg, 0.0) DESC, u.name ASC, u.id ASC";
    public const NOTIFICATIONS = "created_at DESC, id DESC";
    public const FEEDBACK = "f.created_at DESC, f.id DESC";

    /**
     * Whitelist definitions for context-specific sorting parameters
     */
    private const WHITELISTS = [
        'appointments' => [
            'created_at' => 'a.created_at',
            'createdAt' => 'a.created_at',
            'date' => 'a.appointment_date',
            'appointment_date' => 'a.appointment_date',
            'appointmentDate' => 'a.appointment_date',
            'time' => 'a.start_time',
            'status' => 'a.status',
            'id' => 'a.id',
        ],
        'doctors' => [
            'name' => 'u.name',
            'created_at' => 'u.created_at',
            'createdAt' => 'u.created_at',
            'rating' => 'rating_avg',
            'experience' => 'dp.experience_years',
            'fee' => 'dp.consultation_fee',
            'id' => 'u.id',
        ],
        'departments' => [
            'name' => 'd.name',
            'created_at' => 'd.created_at',
            'createdAt' => 'd.created_at',
            'id' => 'd.id',
        ],
        'feedback' => [
            'created_at' => 'f.created_at',
            'createdAt' => 'f.created_at',
            'rating' => 'f.rating',
            'id' => 'f.id',
        ],
        'notifications' => [
            'created_at' => 'created_at',
            'createdAt' => 'created_at',
            'id' => 'id',
        ],
    ];

    /**
     * Build and validate an ORDER BY clause against a strict column whitelist.
     * Guaranteed SQL-injection safe.
     */
    public static function buildOrderBy(string $context, ?string $sortField, ?string $orderDirection, string $defaultClause): string {
        if (!$sortField) {
            return $defaultClause;
        }

        $whitelist = self::WHITELISTS[$context] ?? [];
        if (!isset($whitelist[$sortField])) {
            return $defaultClause;
        }

        $dbColumn = $whitelist[$sortField];
        $direction = strtoupper(trim($orderDirection ?? 'DESC')) === 'ASC' ? 'ASC' : 'DESC';

        // Include tie-breaker
        if (!str_contains($dbColumn, 'id')) {
            $prefix = str_contains($dbColumn, '.') ? explode('.', $dbColumn)[0] . '.' : '';
            return "{$dbColumn} {$direction}, {$prefix}id {$direction}";
        }

        return "{$dbColumn} {$direction}";
    }
}
