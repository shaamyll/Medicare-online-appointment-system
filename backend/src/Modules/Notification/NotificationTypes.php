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
    public const APPOINTMENT_RESCHEDULED = 'appointment_rescheduled';
    public const PAYMENT_CONFIRMED = 'payment_confirmed';
    public const PAYMENT_REFUNDED = 'payment_refunded';
    public const PAYMENT_DUE = 'payment_due';

    // Doctor events
    public const NEW_APPOINTMENT_REQUEST = 'new_appointment_request';
    public const APPOINTMENT_CANCELLED_BY_PATIENT = 'appointment_cancelled_by_patient';
    public const DOCTOR_APPROVED = 'doctor_approved';
    public const DOCTOR_REJECTED = 'doctor_rejected';
    public const DOCTOR_DEACTIVATED = 'doctor_deactivated';
    public const DOCTOR_ACTIVATED = 'doctor_activated';
    public const PAYMENT_RECEIVED = 'payment_received';
    public const NEW_FEEDBACK = 'new_feedback';

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

            case self::PAYMENT_DUE:
                $doctor = $ctx['doctorName'] ?? 'Doctor';
                $doctorFormatted = preg_match('/^Dr\.?\s+/i', $doctor) ? $doctor : "Dr. {$doctor}";
                $date = $ctx['appointmentDate'] ?? '';
                $time = $ctx['startTime'] ?? '';
                $dateTimeStr = trim("{$date}, {$time}");
                $amount = $ctx['amount'] ?? '0.00';
                $aptId = $ctx['appointmentId'] ?? '';
                return [
                    'title' => 'Appointment approved',
                    'message' => "{$doctorFormatted} approved your appointment on {$dateTimeStr}. You can now pay Rs. {$amount}.",
                    'link' => "/dashboard/appointments?pay={$aptId}",
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
                $aptId = $ctx['appointmentId'] ?? '';
                $rateLink = $aptId ? "/dashboard/appointments?tab=history&rate={$aptId}" : "/dashboard/appointments?tab=history";
                return [
                    'title' => 'Consultation Completed',
                    'message' => "How was your visit with Dr. {$doctor}? Share your feedback for appointment #{$ref}.",
                    'link' => $rateLink,
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

            case self::APPOINTMENT_RESCHEDULED:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $by = $ctx['rescheduledBy'] ?? 'The other party';
                $newDate = $ctx['newDate'] ?? '';
                $newTime = $ctx['newStartTime'] ?? '';
                $isDoctor = ($ctx['recipientRole'] ?? '') === 'doctor';
                return [
                    'title' => 'Appointment Rescheduled',
                    'message' => "Appointment #{$ref} was rescheduled by {$by} to {$newDate} at {$newTime}.",
                    'link' => $isDoctor ? '/doctor/appointments' : '/dashboard/appointments',
                ];

            case self::PAYMENT_CONFIRMED:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $txRef = $ctx['transactionRef'] ?? '';
                $amount = $ctx['amount'] ?? '';
                return [
                    'title' => 'Payment Confirmed',
                    'message' => "Your consultation fee of Rs. {$amount} for appointment #{$ref} is marked as paid (Ref: {$txRef}).",
                    'link' => '/dashboard/appointments',
                ];

            case self::PAYMENT_RECEIVED:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $patient = $ctx['patientName'] ?? 'A patient';
                $amount = $ctx['amount'] ?? '';
                return [
                    'title' => 'Consultation Fee Paid',
                    'message' => "{$patient} has paid the consultation fee of Rs. {$amount} for appointment #{$ref}.",
                    'link' => '/doctor/appointments',
                ];

            case self::PAYMENT_REFUNDED:
                $ref = $ctx['appointmentNumber'] ?? 'N/A';
                $amount = $ctx['amount'] ?? '';
                return [
                    'title' => 'Consultation Fee Refunded',
                    'message' => "Appointment #{$ref} was cancelled/rejected. The fee of Rs. {$amount} has been marked as refunded.",
                    'link' => '/dashboard/appointments',
                ];

            case self::NEW_FEEDBACK:
                $patient = $ctx['patientName'] ?? 'A patient';
                $rating = $ctx['rating'] ?? 5;
                return [
                    'title' => 'New Patient Review',
                    'message' => "{$patient} left you a {$rating}-star review for their recent consultation.",
                    'link' => '/doctor/reviews',
                ];

            case self::DOCTOR_APPROVED:
                return [
                    'title' => 'Medical Credentials Approved!',
                    'message' => 'Your doctor registration has been verified and approved by the platform administration. You can now configure your clinical shifts.',
                    'link' => '/doctor/dashboard',
                ];

            case self::DOCTOR_REJECTED:
                return [
                    'title' => 'Doctor Registration Update',
                    'message' => 'Your doctor registration request was not approved by platform administration. Please contact support for credential clarification.',
                    'link' => '/doctor/login',
                ];

            case self::DOCTOR_DEACTIVATED:
                return [
                    'title' => 'Provider Account Deactivated',
                    'message' => 'Your healthcare provider account has been set to inactive by platform administration.',
                    'link' => '/doctor/login',
                ];

            case self::DOCTOR_ACTIVATED:
                return [
                    'title' => 'Provider Account Activated',
                    'message' => 'Your healthcare provider account has been re-activated by platform administration.',
                    'link' => '/doctor/dashboard',
                ];

            case self::NEW_DOCTOR_REGISTRATION:
                $doctor = $ctx['doctorName'] ?? 'New Doctor';
                $specialization = $ctx['specialization'] ?? 'Specialist';
                return [
                    'title' => 'New doctor request',
                    'message' => "Dr. {$doctor} ({$specialization}) has applied and is waiting for approval.",
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
