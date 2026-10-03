<?php

namespace App\Modules\Appointment;

use App\Modules\Doctor\DoctorRepository;
use App\Modules\Notification\NotificationService;
use App\Modules\Notification\NotificationTypes;
use DateTime;
use Exception;

class AppointmentService {
    private AppointmentRepository $repository;
    private DoctorRepository $doctorRepository;

    private NotificationService $notificationService;

    public const MIN_HOURS_BEFORE_RESCHEDULE = 2;
    public const MAX_RESCHEDULES = 2;

    public function __construct() {
        $this->repository = new AppointmentRepository();
        $this->doctorRepository = new DoctorRepository();
        $this->notificationService = new NotificationService();
    }

    /**
     * Enforce appointment status state machine (422 on invalid moves)
     * pending   -> approved | rejected | cancelled
     * approved  -> completed | cancelled
     * completed, rejected, cancelled -> final (no further changes)
     */
    public function validateStatusTransition(string $currentStatus, string $newStatus): void {
        $current = strtolower($currentStatus);
        $new = strtolower($newStatus);

        if ($current === $new) {
            return;
        }

        $validTransitions = [
            'pending' => ['approved', 'rejected', 'cancelled'],
            'approved' => ['completed', 'cancelled'],
            'completed' => [],
            'rejected' => [],
            'cancelled' => []
        ];

        if (!isset($validTransitions[$current])) {
            throw new Exception("Unknown current status '{$currentStatus}'.", 422);
        }

        if (!in_array($new, $validTransitions[$current], true)) {
            throw new Exception("Invalid status transition from '{$currentStatus}' to '{$newStatus}'.", 422);
        }
    }

    public function getAvailableSlots(int $doctorId, string $date): array {
        $dateObj = DateTime::createFromFormat('Y-m-d', $date);
        if (!$dateObj) {
            throw new Exception('Invalid date format. Use YYYY-MM-DD.', 400);
        }

        $dayOfWeek = $dateObj->format('l'); // e.g. "Monday"
        $schedules = $this->doctorRepository->getSchedules($doctorId);

        // Find schedule for day
        $matchedSchedule = null;
        foreach ($schedules as $sched) {
            if (strcasecmp($sched['dayOfWeek'], $dayOfWeek) === 0 && $sched['isAvailable']) {
                $matchedSchedule = $sched;
                break;
            }
        }

        if (!$matchedSchedule) {
            return [
                'date' => $date,
                'dayOfWeek' => $dayOfWeek,
                'hasSchedule' => false,
                'slots' => []
            ];
        }

        $startTimeStr = $matchedSchedule['startTime'];
        $endTimeStr = $matchedSchedule['endTime'];
        $durationMinutes = $matchedSchedule['slotDurationMinutes'] ?: 30;

        $bookedRows = $this->repository->getBookedSlotsForDoctorAndDate($doctorId, $date);
        $bookedMap = [];
        foreach ($bookedRows as $b) {
            $bookedMap[substr($b['start_time'], 0, 5)] = true;
        }

        $slots = [];
        $start = DateTime::createFromFormat('H:i:s', strlen($startTimeStr) === 5 ? $startTimeStr . ':00' : $startTimeStr);
        $end = DateTime::createFromFormat('H:i:s', strlen($endTimeStr) === 5 ? $endTimeStr . ':00' : $endTimeStr);

        while ($start < $end) {
            $slotStart = $start->format('H:i');
            $slotEndObj = clone $start;
            $slotEndObj->modify("+{$durationMinutes} minutes");
            if ($slotEndObj > $end) {
                break;
            }
            $slotEnd = $slotEndObj->format('H:i');

            $isBooked = isset($bookedMap[$slotStart]);

            $slots[] = [
                'startTime' => $slotStart,
                'endTime' => $slotEnd,
                'isAvailable' => !$isBooked
            ];

            $start->modify("+{$durationMinutes} minutes");
        }

        return [
            'date' => $date,
            'dayOfWeek' => $dayOfWeek,
            'hasSchedule' => true,
            'slots' => $slots
        ];
    }

    public function bookAppointment(int $patientId, array $data): array {
        $doctorId = (int)($data['doctorId'] ?? 0);
        $appointmentDate = trim($data['appointmentDate'] ?? '');
        $startTime = trim($data['startTime'] ?? '');
        $reason = trim($data['reasonForVisit'] ?? '');

        if (!$doctorId || empty($appointmentDate) || empty($startTime)) {
            throw new Exception('Doctor, appointment date, and time slot are required.', 400);
        }

        $doctor = $this->doctorRepository->findById($doctorId);
        if (!$doctor) {
            throw new Exception('Selected doctor is not available.', 404);
        }

        // Format times
        $startFormatted = strlen($startTime) === 5 ? $startTime . ':00' : $startTime;
        $endTime = $data['endTime'] ?? '';
        if (empty($endTime)) {
            $dt = DateTime::createFromFormat('H:i', substr($startTime, 0, 5));
            $dt->modify('+30 minutes');
            $endFormatted = $dt->format('H:i:s');
        } else {
            $endFormatted = strlen($endTime) === 5 ? $endTime . ':00' : $endTime;
        }

        // Check if slot is already booked
        if ($this->repository->isSlotBooked($doctorId, $appointmentDate, $startFormatted)) {
            throw new Exception('The selected time slot has already been booked. Please select another slot.', 409);
        }

        $id = $this->repository->create([
            'patient_id' => $patientId,
            'doctor_id' => $doctorId,
            'appointment_date' => $appointmentDate,
            'start_time' => $startFormatted,
            'end_time' => $endFormatted,
            'status' => 'pending',
            'reason_for_visit' => $reason
        ]);

        // Auto-create unpaid payment record in the same booking flow
        try {
            $pdo = $this->repository->getConnection();
            $fee = (float)($doctor['consultationFee'] ?? 100.00);
            $payStmt = $pdo->prepare("INSERT INTO payments (appointment_id, amount, status) VALUES (?, ?, 'unpaid')");
            $payStmt->execute([$id, $fee]);
        } catch (\Throwable $e) {
            error_log('Failed to create unpaid payment row: ' . $e->getMessage());
        }

        $apt = $this->repository->findById($id);

        // 1. Notify patient that request was submitted
        $patientMeta = NotificationTypes::build(NotificationTypes::APPOINTMENT_BOOKED, [
            'appointmentNumber' => $apt['appointmentNumber'],
            'doctorName' => $apt['doctor']['name'] ?? 'Doctor',
        ]);
        $this->notificationService->notify(
            $patientId,
            NotificationTypes::APPOINTMENT_BOOKED,
            $patientMeta['title'],
            $patientMeta['message'],
            ['appointmentId' => $id, 'doctorId' => $doctorId],
            $patientMeta['link']
        );

        // 2. Notify doctor about new appointment request
        $doctorMeta = NotificationTypes::build(NotificationTypes::NEW_APPOINTMENT_REQUEST, [
            'appointmentNumber' => $apt['appointmentNumber'],
            'patientName' => $apt['patient']['name'] ?? 'Patient',
            'appointmentDate' => $apt['appointmentDate'],
            'startTime' => $apt['startTime'],
        ]);
        $this->notificationService->notify(
            $doctorId,
            NotificationTypes::NEW_APPOINTMENT_REQUEST,
            $doctorMeta['title'],
            $doctorMeta['message'],
            ['appointmentId' => $id, 'patientId' => $patientId],
            $doctorMeta['link']
        );

        // 3. Broadcast data changed
        $this->notificationService->publishDataChanged([$patientId, $doctorId], ['appointments']);

        return $apt;
    }

    public function cancelAppointment(int $appointmentId, array $user, ?string $reason = null): array {
        $apt = $this->repository->findById($appointmentId);
        if (!$apt) {
            throw new Exception('Appointment not found.', 404);
        }

        // Role authorization check
        if ($user['role'] === 'patient' && $apt['patient']['id'] !== $user['id']) {
            throw new Exception('Unauthorized to cancel this appointment.', 403);
        }
        if ($user['role'] === 'doctor' && $apt['doctor']['id'] !== $user['id']) {
            throw new Exception('Unauthorized to cancel this appointment.', 403);
        }

        // Enforce state machine
        $this->validateStatusTransition($apt['status'], 'cancelled');

        if ($reason !== null) {
            $reason = trim($reason);
            if (mb_strlen($reason) > 255) {
                throw new Exception('Cancellation reason must not exceed 255 characters.', 422);
            }
        }

        $this->repository->updateStatus($appointmentId, 'cancelled', $reason);

        $patientId = (int)$apt['patient']['id'];
        $doctorId = (int)$apt['doctor']['id'];

        // Handle demo refund if appointment was paid
        $this->handlePaymentRefundIfPaid($appointmentId, $apt, $patientId);

        $updated = $this->repository->findById($appointmentId);

        if ($user['role'] === 'patient') {
            // Doctor receives notification
            $docMeta = NotificationTypes::build(NotificationTypes::APPOINTMENT_CANCELLED_BY_PATIENT, [
                'appointmentNumber' => $apt['appointmentNumber'],
                'patientName' => $apt['patient']['name'] ?? 'Patient',
            ]);
            $this->notificationService->notify(
                $doctorId,
                NotificationTypes::APPOINTMENT_CANCELLED_BY_PATIENT,
                $docMeta['title'],
                $docMeta['message'],
                ['appointmentId' => $appointmentId],
                $docMeta['link']
            );

            // Admin receives notification summary
            $this->notificationService->notifyAdmins(
                NotificationTypes::ADMIN_APPOINTMENT_CANCELLED,
                'Appointment Cancelled',
                "Appointment #{$apt['appointmentNumber']} was cancelled by patient {$apt['patient']['name']}.",
                ['appointmentId' => $appointmentId],
                '/admin/appointments'
            );
        } else {
            // Cancelled by doctor or admin -> patient receives notification
            $by = $user['role'] === 'admin' ? 'hospital administration' : ('Dr. ' . ($apt['doctor']['name'] ?? 'Doctor'));
            $patMeta = NotificationTypes::build(NotificationTypes::APPOINTMENT_CANCELLED, [
                'appointmentNumber' => $apt['appointmentNumber'],
                'cancelledBy' => $by,
            ]);
            $this->notificationService->notify(
                $patientId,
                NotificationTypes::APPOINTMENT_CANCELLED,
                $patMeta['title'],
                $patMeta['message'],
                ['appointmentId' => $appointmentId],
                $patMeta['link']
            );
        }

        $this->notificationService->publishDataChanged([$patientId, $doctorId], ['appointments']);

        return $updated;
    }

    public function updateStatus(int $appointmentId, string $status, array $user, ?string $reason = null): array {
        $status = strtolower($status);
        $allowed = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            throw new Exception('Invalid appointment status.', 400);
        }

        $apt = $this->repository->findById($appointmentId);
        if (!$apt) {
            throw new Exception('Appointment not found.', 404);
        }

        if ($user['role'] === 'doctor' && $apt['doctor']['id'] !== $user['id']) {
            throw new Exception('You can only update appointments assigned to you.', 403);
        }

        // Enforce state machine
        $this->validateStatusTransition($apt['status'], $status);

        if ($reason !== null) {
            $reason = trim($reason);
            if (mb_strlen($reason) > 255) {
                throw new Exception('Reason must not exceed 255 characters.', 422);
            }
        }

        $this->repository->updateStatus($appointmentId, $status, $reason);

        $patientId = (int)$apt['patient']['id'];
        $doctorId = (int)$apt['doctor']['id'];

        // If rejected or cancelled, refund payment if it was paid
        if ($status === 'rejected' || $status === 'cancelled') {
            $this->handlePaymentRefundIfPaid($appointmentId, $apt, $patientId);
        }

        $updated = $this->repository->findById($appointmentId);

        if ($status === 'approved') {
            $meta = NotificationTypes::build(NotificationTypes::APPOINTMENT_APPROVED, [
                'appointmentNumber' => $apt['appointmentNumber'],
                'doctorName' => $apt['doctor']['name'] ?? 'Doctor',
                'appointmentDate' => $apt['appointmentDate'],
                'startTime' => $apt['startTime'],
            ]);
            $this->notificationService->notify(
                $patientId,
                NotificationTypes::APPOINTMENT_APPROVED,
                $meta['title'],
                $meta['message'],
                ['appointmentId' => $appointmentId],
                $meta['link']
            );
        } elseif ($status === 'rejected') {
            $meta = NotificationTypes::build(NotificationTypes::APPOINTMENT_REJECTED, [
                'appointmentNumber' => $apt['appointmentNumber'],
                'doctorName' => $apt['doctor']['name'] ?? 'Doctor',
                'reason' => $reason,
            ]);
            $this->notificationService->notify(
                $patientId,
                NotificationTypes::APPOINTMENT_REJECTED,
                $meta['title'],
                $meta['message'],
                ['appointmentId' => $appointmentId],
                $meta['link']
            );
        } elseif ($status === 'completed') {
            $meta = NotificationTypes::build(NotificationTypes::APPOINTMENT_COMPLETED, [
                'appointmentNumber' => $apt['appointmentNumber'],
                'doctorName' => $apt['doctor']['name'] ?? 'Doctor',
            ]);
            $this->notificationService->notify(
                $patientId,
                NotificationTypes::APPOINTMENT_COMPLETED,
                $meta['title'],
                $meta['message'],
                ['appointmentId' => $appointmentId],
                $meta['link']
            );
        }

        $this->notificationService->publishDataChanged([$patientId, $doctorId], ['appointments']);

        return $updated;
    }

    /**
     * Reschedule an appointment:
     * - Allowed for owning patient or doctor
     * - Allowed only when pending or approved
     * - At least 2 hours before current start time
     * - Maximum 2 reschedules per appointment
     * - New slot must be future, valid for schedule, and free (checked in DB transaction with row locking)
     * - Patient rescheduling an approved appointment resets status to pending; doctor keeps status; pending stays pending.
     */
    public function rescheduleAppointment(int $appointmentId, string $newDate, string $newStartTime, array $user): array {
        $apt = $this->repository->findById($appointmentId);
        if (!$apt) {
            throw new Exception('Appointment not found.', 404);
        }

        $isPatient = ($user['role'] === 'patient' && $apt['patient']['id'] === $user['id']);
        $isDoctor = ($user['role'] === 'doctor' && $apt['doctor']['id'] === $user['id']);
        $isAdmin = ($user['role'] === 'admin');

        if (!$isPatient && !$isDoctor && !$isAdmin) {
            throw new Exception('Unauthorized to reschedule this appointment.', 403);
        }

        $currentStatus = strtolower($apt['status']);
        if ($currentStatus !== 'pending' && $currentStatus !== 'approved') {
            throw new Exception("Only pending or approved appointments can be rescheduled. Current status: {$apt['status']}.", 422);
        }

        if (($apt['rescheduleCount'] ?? 0) >= self::MAX_RESCHEDULES) {
            throw new Exception("Maximum of " . self::MAX_RESCHEDULES . " reschedules allowed per appointment.", 422);
        }

        // At least 2 hours before the current start time
        $currentStartStr = strlen($apt['startTime']) === 5 ? $apt['startTime'] . ':00' : $apt['startTime'];
        $currentSlotTs = strtotime($apt['appointmentDate'] . ' ' . $currentStartStr);
        $minAllowedTs = time() + (self::MIN_HOURS_BEFORE_RESCHEDULE * 3600);
        if ($currentSlotTs < $minAllowedTs) {
            throw new Exception("Appointments can only be rescheduled at least " . self::MIN_HOURS_BEFORE_RESCHEDULE . " hours before the scheduled time.", 422);
        }

        // Clean new date and time
        $newDate = trim($newDate);
        $newStartTimeClean = trim($newStartTime);
        $newStartTime5 = substr($newStartTimeClean, 0, 5);
        $newStartTimeFull = strlen($newStartTimeClean) === 5 ? $newStartTimeClean . ':00' : $newStartTimeClean;

        $newSlotTs = strtotime("$newDate $newStartTimeFull");
        if ($newSlotTs <= time()) {
            throw new Exception("The new appointment time must be in the future.", 422);
        }

        // Verify slot validity with doctor's weekly schedule
        $dateObj = DateTime::createFromFormat('Y-m-d', $newDate);
        if (!$dateObj) {
            throw new Exception('Invalid date format. Use YYYY-MM-DD.', 400);
        }
        $dayOfWeek = $dateObj->format('l');
        $doctorId = (int)$apt['doctor']['id'];

        $schedules = $this->doctorRepository->getSchedules($doctorId);
        $matchedSchedule = null;
        foreach ($schedules as $sched) {
            if (strcasecmp($sched['dayOfWeek'], $dayOfWeek) === 0 && $sched['isAvailable']) {
                $matchedSchedule = $sched;
                break;
            }
        }

        if (!$matchedSchedule) {
            throw new Exception("The doctor is not scheduled for consultations on {$dayOfWeek}s.", 422);
        }

        $schedStart = substr($matchedSchedule['startTime'], 0, 5);
        $schedEnd = substr($matchedSchedule['endTime'], 0, 5);
        if ($newStartTime5 < $schedStart || $newStartTime5 >= $schedEnd) {
            throw new Exception("The selected time slot is outside the doctor's consultation hours ({$schedStart} - {$schedEnd}).", 422);
        }

        $duration = $matchedSchedule['slotDurationMinutes'] ?: 30;
        $startDt = DateTime::createFromFormat('H:i', $newStartTime5);
        $endDt = clone $startDt;
        $endDt->modify("+{$duration} minutes");
        $newEndTime = $endDt->format('H:i:s');

        // Status determination:
        // If patient reschedules an approved appointment -> reset to pending
        // If doctor reschedules -> keep status as approved
        // Pending stays pending
        $newStatus = $currentStatus;
        if ($isPatient && $currentStatus === 'approved') {
            $newStatus = 'pending';
        }

        // DB transaction with row locking so two people cannot take the same slot
        $pdo = $this->repository->getConnection();
        $pdo->beginTransaction();
        try {
            $lockStmt = $pdo->prepare("
                SELECT id FROM appointments 
                WHERE doctor_id = ? AND appointment_date = ? AND start_time = ? 
                  AND status NOT IN ('cancelled', 'rejected') AND id != ?
                FOR UPDATE
            ");
            $lockStmt->execute([$doctorId, $newDate, $newStartTimeFull, $appointmentId]);
            if ($lockStmt->fetch()) {
                $pdo->rollBack();
                throw new Exception("The selected time slot has already been booked by another patient.", 409);
            }

            // Update appointment
            $upStmt = $pdo->prepare("
                UPDATE appointments 
                SET appointment_date = ?, start_time = ?, end_time = ?, status = ?, reschedule_count = reschedule_count + 1
                WHERE id = ?
            ");
            $upStmt->execute([$newDate, $newStartTimeFull, $newEndTime, $newStatus, $appointmentId]);

            // Log reschedule record
            $oldStartFull = strlen($apt['startTime']) === 5 ? $apt['startTime'] . ':00' : $apt['startTime'];
            $resLog = $pdo->prepare("
                INSERT INTO appointment_reschedules (appointment_id, old_date, old_start_time, new_date, new_start_time, rescheduled_by)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $resLog->execute([
                $appointmentId,
                $apt['appointmentDate'],
                $oldStartFull,
                $newDate,
                $newStartTimeFull,
                $user['id']
            ]);

            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        $updated = $this->repository->findById($appointmentId);
        $patientId = (int)$apt['patient']['id'];

        // Send notification to the other party
        if ($isPatient) {
            $notifMeta = NotificationTypes::build(NotificationTypes::APPOINTMENT_RESCHEDULED, [
                'appointmentNumber' => $apt['appointmentNumber'],
                'rescheduledBy' => $user['name'] ?? 'Patient',
                'newDate' => $newDate,
                'newStartTime' => $newStartTime5,
                'recipientRole' => 'doctor'
            ]);
            $this->notificationService->notify(
                $doctorId,
                NotificationTypes::APPOINTMENT_RESCHEDULED,
                $notifMeta['title'],
                $notifMeta['message'],
                ['appointmentId' => $appointmentId],
                $notifMeta['link']
            );
        } else {
            $notifMeta = NotificationTypes::build(NotificationTypes::APPOINTMENT_RESCHEDULED, [
                'appointmentNumber' => $apt['appointmentNumber'],
                'rescheduledBy' => 'Dr. ' . ($apt['doctor']['name'] ?? 'Doctor'),
                'newDate' => $newDate,
                'newStartTime' => $newStartTime5,
                'recipientRole' => 'patient'
            ]);
            $this->notificationService->notify(
                $patientId,
                NotificationTypes::APPOINTMENT_RESCHEDULED,
                $notifMeta['title'],
                $notifMeta['message'],
                ['appointmentId' => $appointmentId],
                $notifMeta['link']
            );
        }

        $this->notificationService->publishDataChanged([$patientId, $doctorId], ['appointments']);

        return $updated;
    }

    private function handlePaymentRefundIfPaid(int $appointmentId, array $apt, int $patientId): void {
        try {
            $pdo = $this->repository->getConnection();
            $checkStmt = $pdo->prepare("SELECT id, amount, status FROM payments WHERE appointment_id = ? AND status = 'paid'");
            $checkStmt->execute([$appointmentId]);
            $paidPayment = $checkStmt->fetch();

            if ($paidPayment) {
                $upStmt = $pdo->prepare("UPDATE payments SET status = 'refunded' WHERE id = ?");
                $upStmt->execute([(int)$paidPayment['id']]);

                $amount = (float)$paidPayment['amount'];
                $meta = NotificationTypes::build(NotificationTypes::PAYMENT_REFUNDED, [
                    'appointmentNumber' => $apt['appointmentNumber'],
                    'amount' => number_format($amount, 2),
                ]);
                $this->notificationService->notify(
                    $patientId,
                    NotificationTypes::PAYMENT_REFUNDED,
                    $meta['title'],
                    $meta['message'],
                    ['appointmentId' => $appointmentId],
                    $meta['link']
                );
            }
        } catch (\Throwable $e) {
            error_log('Error processing refund: ' . $e->getMessage());
        }
    }

    public function addConsultationNotes(int $appointmentId, int $doctorId, array $data): array {
        $apt = $this->repository->findById($appointmentId);
        if (!$apt) {
            throw new Exception('Appointment not found.', 404);
        }

        if ($apt['doctor']['id'] !== $doctorId) {
            throw new Exception('Unauthorized to add consultation notes to this appointment.', 403);
        }

        $this->repository->upsertConsultationRecord($appointmentId, $data);
        $this->repository->updateStatus($appointmentId, 'completed');
        $updated = $this->repository->findById($appointmentId);

        $patientId = (int)$apt['patient']['id'];

        // Notify patient of consultation notes/prescription
        $meta = NotificationTypes::build(NotificationTypes::APPOINTMENT_COMPLETED, [
            'appointmentNumber' => $apt['appointmentNumber'],
            'doctorName' => $apt['doctor']['name'] ?? 'Doctor',
        ]);
        $this->notificationService->notify(
            $patientId,
            NotificationTypes::APPOINTMENT_COMPLETED,
            $meta['title'],
            $meta['message'],
            ['appointmentId' => $appointmentId],
            $meta['link']
        );

        $this->notificationService->publishDataChanged([$patientId, $doctorId], ['appointments']);

        return $updated;
    }

    public function getAppointmentById(int $id): ?array {
        return $this->repository->findById($id);
    }

    public function getPatientAppointments(int $patientId): array {
        return $this->repository->findByPatient($patientId);
    }

    public function getDoctorAppointments(int $doctorId, ?string $status = null): array {
        return $this->repository->findByDoctor($doctorId, $status);
    }

    public function getAllAppointments(?string $status = null, ?string $date = null, ?int $doctorId = null): array {
        return $this->repository->findAll($status, $date, $doctorId);
    }
}
