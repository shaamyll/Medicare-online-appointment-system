<?php

namespace App\Modules\Feedback;

use App\Modules\Appointment\AppointmentRepository;
use App\Modules\Notification\NotificationService;
use App\Modules\Notification\NotificationTypes;
use Exception;

class FeedbackService {
    private FeedbackRepository $repository;
    private AppointmentRepository $appointmentRepository;
    private NotificationService $notificationService;

    public function __construct() {
        $this->repository = new FeedbackRepository();
        $this->appointmentRepository = new AppointmentRepository();
        $this->notificationService = new NotificationService();
    }

    /**
     * Submit feedback for an appointment
     * Owning patient only, only when appointment status is completed, only once.
     */
    public function submitFeedback(int $appointmentId, array $data, array $user): array {
        $apt = $this->appointmentRepository->findById($appointmentId);
        if (!$apt) {
            throw new Exception('Appointment not found.', 404);
        }

        // Only owning patient can submit feedback
        if ($user['role'] !== 'patient' || $apt['patient']['id'] !== $user['id']) {
            throw new Exception('Only the patient of this appointment can submit feedback.', 403);
        }

        // Must be completed
        if (strtolower($apt['status']) !== 'completed') {
            throw new Exception('Feedback can only be submitted for completed consultations.', 422);
        }

        // Only once per appointment
        $existing = $this->repository->findByAppointmentId($appointmentId);
        if ($existing) {
            throw new Exception('Feedback has already been submitted for this consultation.', 422);
        }

        $rating = (int)($data['rating'] ?? 0);
        if ($rating < 1 || $rating > 5) {
            throw new Exception('Rating must be an integer between 1 and 5 stars.', 422);
        }

        $comment = trim($data['comment'] ?? '');
        if (mb_strlen($comment) > 500) {
            throw new Exception('Comment must not exceed 500 characters.', 422);
        }

        $doctorId = (int)$apt['doctor']['id'];
        $patientId = (int)$apt['patient']['id'];

        $feedbackId = $this->repository->create([
            'appointment_id' => $appointmentId,
            'patient_id' => $patientId,
            'doctor_id' => $doctorId,
            'rating' => $rating,
            'comment' => $comment ?: null
        ]);

        // Notify doctor of new feedback
        $notifMeta = NotificationTypes::build(NotificationTypes::NEW_FEEDBACK, [
            'patientName' => $user['name'] ?? 'A patient',
            'rating' => $rating,
        ]);
        $this->notificationService->notify(
            $doctorId,
            NotificationTypes::NEW_FEEDBACK,
            $notifMeta['title'],
            $notifMeta['message'],
            ['appointmentId' => $appointmentId, 'rating' => $rating],
            $notifMeta['link']
        );

        // Invalidate doctor cache, admin stats, and feedback queries
        $this->notificationService->publishDataChanged([$patientId, $doctorId], ['doctors', 'feedback']);

        return [
            'id' => $feedbackId,
            'appointmentId' => $appointmentId,
            'rating' => $rating,
            'comment' => $comment,
            'createdAt' => date('Y-m-d H:i:s'),
            'message' => 'Thank you! Your feedback has been recorded.'
        ];
    }

    /**
     * Public feedback list for a doctor
     */
    public function getDoctorFeedback(int $doctorId, int $page = 1, int $limit = 10): array {
        $summary = $this->repository->getDoctorFeedbackSummary($doctorId);
        $paginated = $this->repository->paginateByDoctor($doctorId, $page, $limit, true);

        return array_merge($summary, $paginated);
    }

    /**
     * Doctor's own feedback list
     */
    public function getDoctorOwnFeedback(int $doctorId, int $page = 1, int $limit = 10): array {
        $summary = $this->repository->getDoctorFeedbackSummary($doctorId);
        $paginated = $this->repository->paginateByDoctor($doctorId, $page, $limit, false);

        return array_merge($summary, $paginated);
    }

    /**
     * Admin feedback management list
     */
    public function getAdminFeedbackList(array $filters = [], int $page = 1, int $limit = 10): array {
        return $this->repository->paginateAdmin($filters, $page, $limit);
    }

    /**
     * Admin delete feedback
     */
    public function deleteFeedback(int $id): bool {
        $existing = $this->repository->findById($id);
        if (!$existing) {
            throw new Exception('Feedback entry not found.', 404);
        }

        $doctorId = (int)$existing['doctor_id'];
        $deleted = $this->repository->delete($id);

        if ($deleted) {
            $this->notificationService->publishDataChanged([$doctorId], ['doctors', 'feedback']);
        }

        return $deleted;
    }
}
