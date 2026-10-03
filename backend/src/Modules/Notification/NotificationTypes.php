<?php

namespace App\Modules\Notification;

class NotificationTypes
{
    // Patient events
    public const APPOINTMENT_BOOKED = 'appointment_booked';
    public const APPOINTMENT_APPROVED = 'appointment_approved';
    public const APPOINTMENT_REJECTED = 'appointment_rejected';
    public const APPOINTMENT_CANCELLED = 'appointment_cancelled';
    public const APPOINTMENT_COMPLETED = 'appointment_completed';

    // Doctor events
    public const NEW_APPOINTMENT_REQUEST = 'new_appointment_request';
    public const APPOINTMENT_CANCELLED_BY_PATIENT = 'appointment_cancelled_by_patient';
    public const DOCTOR_APPROVED = 'doctor_approved';
    public const DOCTOR_REJECTED = 'doctor_rejected';
    public const DOCTOR_DEACTIVATED = 'doctor_deactivated';
    public const DOCTOR_ACTIVATED = 'doctor_activated';

    // Admin events
    public const NEW_DOCTOR_REGISTRATION = 'new_doctor_registration';
    public const NEW_PATIENT_REGISTERED = 'new_patient_registered';
    public const ADMIN_APPOINTMENT_CANCELLED = 'appointment_cancelled';

    /**
     * Builds title, message, and target link for a notification type + context
     */
    public static function build(string $type, array $ctx = []): array
    {
        switch ($type) {
            case self::APPOINTMENT_BOOKED:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $doctor = $ctx['doctorName'] ?? 'Doctor';
                return [
                    'title' => 'Appointment Request Submitted',
                    'message' => "Your appointment request #{$ref} with Dr. {$doctor} has been submitted and is awaiting confirmation.",
                    'link' => '/dashboard/appointments',
                ];

            case self::APPOINTMENT_APPROVED:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $doctor = $ctx['doctorName'] ?? 'Doctor';
                $date = $ctx['appointmentDate'] ?? 'scheduled date';
                $time = $ctx['startTime'] ?? '';
                return [
                    'title' => 'Appointment Confirmed',
                    'message' => "Dr. {$doctor} has approved your appointment #{$ref} for {$date} at {$time}.",
                    'link' => '/dashboard/appointments',
                ];

            case self::APPOINTMENT_REJECTED:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $doctor = $ctx['doctorName'] ?? 'Doctor';
                $reason = !empty($ctx['reason']) ? " Reason: {$ctx['reason']}" : '';
                return [
                    'title' => 'Appointment Declined',
                    'message' => "Your appointment request #{$ref} with Dr. {$doctor} could not be scheduled.{$reason}",
                    'link' => '/dashboard/appointments',
                ];

            case self::APPOINTMENT_CANCELLED:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $by = $ctx['cancelledBy'] ?? 'the clinic';
                return [
                    'title' => 'Appointment Cancelled',
                    'message' => "Appointment #{$ref} was cancelled by {$by}.",
                    'link' => '/dashboard/appointments',
                ];

            case self::APPOINTMENT_COMPLETED:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $doctor = $ctx['doctorName'] ?? 'Doctor';
                return [
                    'title' => 'Consultation Completed & Prescription Ready',
                    'message' => "Dr. {$doctor} has concluded consultation #{$ref}. Your diagnosis and clinical prescription are now available.",
                    'link' => '/dashboard/appointments',
                ];

            case self::NEW_APPOINTMENT_REQUEST:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $patient = $ctx['patientName'] ?? 'A patient';
                $date = $ctx['appointmentDate'] ?? '';
                $time = $ctx['startTime'] ?? '';
                return [
                    'title' => 'New Consultation Request',
                    'message' => "{$patient} requested an appointment (#{$ref}) on {$date} at {$time}.",
                    'link' => '/doctor/appointments',
                ];

            case self::APPOINTMENT_CANCELLED_BY_PATIENT:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $patient = $ctx['patientName'] ?? 'Patient';
                return [
                    'title' => 'Patient Cancelled Appointment',
                    'message' => "{$patient} has cancelled scheduled appointment #{$ref}.",
                    'link' => '/doctor/appointments',
                ];

            case self::DOCTOR_APPROVED:
                return [
                    'title' => 'Medical Credentials Approved!',
                    'message' => 'Your doctor registration has been verified and approved by the hospital administration. You can now configure your clinical shifts.',
                    'link' => '/doctor/dashboard',
                ];

            case self::DOCTOR_REJECTED:
                return [
                    'title' => 'Doctor Registration Update',
                    'message' => 'Your doctor registration request was not approved by the medical board. Please contact administration for credential clarification.',
                    'link' => '/doctor/login',
                ];

            case self::DOCTOR_DEACTIVATED:
                return [
                    'title' => 'Clinical Account Deactivated',
                    'message' => 'Your medical staff account has been set to inactive by hospital administration.',
                    'link' => '/doctor/login',
                ];

            case self::DOCTOR_ACTIVATED:
                return [
                    'title' => 'Clinical Account Activated',
                    'message' => 'Your medical staff account has been re-activated by hospital administration.',
                    'link' => '/doctor/dashboard',
                ];

            case self::NEW_DOCTOR_REGISTRATION:
                $doctor = $ctx['doctorName'] ?? 'New Doctor';
                $license = $ctx['licenseNumber'] ?? 'N/A';
                return [
                    'title' => 'Doctor Application Pending Verification',
                    'message' => "Dr. {$doctor} (License: {$license}) submitted credentials awaiting verification against official medical registers.",
                    'link' => '/admin/doctor-requests',
                ];

            case self::NEW_PATIENT_REGISTERED:
                $patient = $ctx['patientName'] ?? 'New Patient';
                $email = $ctx['email'] ?? '';
                return [
                    'title' => 'New Patient Registered',
                    'message' => "{$patient} ({$email}) registered a new patient account.",
                    'link' => '/admin/patients',
                ];

            default:
                return [
                    'title' => $ctx['title'] ?? 'Medi-Care Notification',
                    'message' => $ctx['message'] ?? 'You have a new update regarding your Medi-Care account.',
                    'link' => $ctx['link'] ?? null,
                ];
        }
    }
}
