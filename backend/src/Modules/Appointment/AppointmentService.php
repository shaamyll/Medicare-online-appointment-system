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

    public function __construct() {
        $this->repository = new AppointmentRepository();
        $this->doctorRepository = new DoctorRepository();
        $this->notificationService = new NotificationService();
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

    public function cancelAppointment(int $appointmentId, array $user): array {
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

        if (in_array(strtolower($apt['status']), ['completed', 'cancelled'])) {
            throw new Exception("Appointment is already {$apt['status']}.", 400);
        }

        $this->repository->updateStatus($appointmentId, 'cancelled');
        $updated = $this->repository->findById($appointmentId);

        $patientId = (int)$apt['patient']['id'];
        $doctorId = (int)$apt['doctor']['id'];

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

        $this->repository->updateStatus($appointmentId, $status);
        $updated = $this->repository->findById($appointmentId);

        $patientId = (int)$apt['patient']['id'];
        $doctorId = (int)$apt['doctor']['id'];

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

    public function getPatientAppointments(int $patientId): array {
        return $this->repository->findByPatient($patientId);
    }

    public function getDoctorAppointments(int $doctorId, ?string $status = null): array {
        return $this->repository->findByDoctor($doctorId, $status);
    }

    public function getAllAppointments(?string $status = null, ?string $date = null): array {
        return $this->repository->findAll($status, $date);
    }
}
