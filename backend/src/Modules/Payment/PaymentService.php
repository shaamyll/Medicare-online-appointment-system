<?php

namespace App\Modules\Payment;

use App\Modules\Appointment\AppointmentRepository;
use App\Modules\Notification\NotificationService;
use App\Modules\Notification\NotificationTypes;
use Exception;

class PaymentService {
    private PaymentRepository $repository;
    private AppointmentRepository $appointmentRepository;
    private NotificationService $notificationService;

    public function __construct() {
        $this->repository = new PaymentRepository();
        $this->appointmentRepository = new AppointmentRepository();
        $this->notificationService = new NotificationService();
    }

    /**
     * Process demo payment for an appointment
     * Owning patient only
     */
    public function pay(int $appointmentId, string $method, array $user): array {
        $apt = $this->appointmentRepository->findById($appointmentId);
        if (!$apt) {
            throw new Exception('Appointment not found.', 404);
        }

        // Only owning patient can pay
        if ($user['role'] !== 'patient' || $apt['patient']['id'] !== $user['id']) {
            throw new Exception('Only the patient who booked this appointment can submit payment.', 403);
        }

        // Validate appointment is not rejected or cancelled
        $status = strtolower($apt['status']);
        if ($status === 'cancelled' || $status === 'rejected') {
            throw new Exception("Cannot process payment for a {$status} appointment.", 422);
        }

        // Validate method
        $method = strtolower(trim($method));
        $allowedMethods = ['upi', 'card', 'cash'];
        if (!in_array($method, $allowedMethods, true)) {
            throw new Exception('Invalid payment method. Allowed: UPI, Card, Cash.', 400);
        }

        // Check existing payment
        $payment = $this->repository->findByAppointmentId($appointmentId);
        if (!$payment) {
            $fee = (float)($apt['doctor']['consultationFee'] ?? 100.00);
            $payment = $this->repository->createOrGetForAppointment($appointmentId, $fee);
        }

        if ($payment['status'] === 'paid') {
            throw new Exception('Payment has already been completed for this appointment.', 422);
        }

        // Generate demo transaction reference: e.g. MC-YYYYMMDD-XXXXXX
        $datePart = date('Ymd');
        $randomHex = strtoupper(bin2hex(random_bytes(3)));
        $transactionRef = "MC-{$datePart}-{$randomHex}";
        $paidAt = date('Y-m-d H:i:s');

        $this->repository->markAsPaid((int)$payment['id'], $method, $transactionRef, $paidAt);

        // Fetch updated payment with joined appointment info
        $updatedPayment = $this->repository->findByAppointmentId($appointmentId);

        // Send notifications
        $doctorId = (int)$apt['doctor']['id'];
        $patientId = (int)$apt['patient']['id'];
        $amountStr = number_format((float)$payment['amount'], 2);

        // 1. Notify doctor
        $docMeta = NotificationTypes::build(NotificationTypes::PAYMENT_RECEIVED, [
            'appointmentNumber' => $apt['appointmentNumber'],
            'patientName' => $user['name'] ?? 'Patient',
            'amount' => $amountStr,
        ]);
        $this->notificationService->notify(
            $doctorId,
            NotificationTypes::PAYMENT_RECEIVED,
            $docMeta['title'],
            $docMeta['message'],
            ['appointmentId' => $appointmentId, 'transactionRef' => $transactionRef],
            $docMeta['link']
        );

        // 2. Notify patient
        $patMeta = NotificationTypes::build(NotificationTypes::PAYMENT_CONFIRMED, [
            'appointmentNumber' => $apt['appointmentNumber'],
            'amount' => $amountStr,
            'transactionRef' => $transactionRef,
        ]);
        $this->notificationService->notify(
            $patientId,
            NotificationTypes::PAYMENT_CONFIRMED,
            $patMeta['title'],
            $patMeta['message'],
            ['appointmentId' => $appointmentId, 'transactionRef' => $transactionRef],
            $patMeta['link']
        );

        // Broadcast data changes to relevant queries
        $this->notificationService->publishDataChanged([$patientId, $doctorId], ['appointments', 'admin-stats', 'reports']);

        return [
            'id' => (int)$updatedPayment['id'],
            'appointmentId' => $appointmentId,
            'amount' => (float)$updatedPayment['amount'],
            'status' => $updatedPayment['status'],
            'method' => $updatedPayment['method'],
            'transactionRef' => $updatedPayment['transaction_ref'],
            'paidAt' => $updatedPayment['paid_at'],
            'message' => 'Demo payment completed successfully. No real money was charged.'
        ];
    }

    /**
     * Get printable receipt data
     * Owning patient, doctor of appointment, or admin
     */
    public function getReceipt(int $appointmentId, array $user): array {
        $payment = $this->repository->findByAppointmentId($appointmentId);
        if (!$payment) {
            throw new Exception('Payment record not found for this appointment.', 404);
        }

        // Authorization check
        $patientId = (int)$payment['patient_id'];
        $doctorId = (int)$payment['doctor_id'];

        if ($user['role'] === 'patient' && $user['id'] !== $patientId) {
            throw new Exception('Unauthorized to access this receipt.', 403);
        }
        if ($user['role'] === 'doctor' && $user['id'] !== $doctorId) {
            throw new Exception('Unauthorized to access this receipt.', 403);
        }

        return [
            'clinic' => [
                'name' => 'Medi-Care Health System',
                'tagline' => 'Excellence in Clinical Care & Patient Safety',
                'address' => '123 Medical Center Blvd, Suite 100, Health City, HC 56001',
                'phone' => '+1 (800) 555-CARE',
                'email' => 'support@medicare-health.org',
                'website' => 'www.medicare-health.org'
            ],
            'receipt' => [
                'id' => (int)$payment['id'],
                'transactionRef' => $payment['transaction_ref'] ?? 'UNPAID',
                'amount' => (float)$payment['amount'],
                'status' => strtoupper($payment['status']),
                'method' => $payment['method'] ? strtoupper($payment['method']) : 'N/A',
                'paidAt' => $payment['paid_at'],
                'createdAt' => $payment['created_at'],
                'isDemo' => true,
                'note' => 'Demo payment transaction — no real currency processed.'
            ],
            'appointment' => [
                'id' => (int)$payment['appointment_id'],
                'appointmentNumber' => $payment['appointment_number'],
                'appointmentDate' => $payment['appointment_date'],
                'startTime' => substr($payment['start_time'], 0, 5),
                'endTime' => substr($payment['end_time'], 0, 5),
                'status' => strtoupper($payment['appointment_status']),
            ],
            'patient' => [
                'id' => $patientId,
                'name' => $payment['patient_name'],
                'email' => $payment['patient_email'],
                'phone' => $payment['patient_phone'],
            ],
            'doctor' => [
                'id' => $doctorId,
                'name' => $payment['doctor_name'],
                'email' => $payment['doctor_email'],
                'specialization' => $payment['doctor_specialization'] ?? 'Specialist',
                'department' => $payment['department_name'] ?? 'General Medicine'
            ]
        ];
    }
}
