<?php

namespace App\Modules\Feedback;

use App\Modules\Appointment\AppointmentRepository;
use App\Modules\Notification\NotificationService;
use App\Modules\Notification\NotificationTypes;
use Exception;

class FeedbackService {
    public const EDIT_WINDOW_DAYS = 7;

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
            throw new Exception('Feedback has already been submitted for this consultation.', 409);
        }

        $rating = (int)($data['rating'] ?? 0);
        if ($rating < 1 || $rating > 5) {
            throw new Exception('Rating must be an integer between 1 and 5 stars.', 422);
        }

        $rawComment = trim($data['comment'] ?? '');
        $comment = strip_tags($rawComment);
        if (mb_strlen($comment) > 500) {
            throw new Exception('Comment must not exceed 500 characters.', 422);
        }

        // Optional quick tags
        $tags = null;
        if (isset($data['tags']) && is_array($data['tags'])) {
            $tags = array_values(array_filter(array_map('trim', $data['tags']), fn($t) => is_string($t) && $t !== ''));
        }

        $doctorId = (int)$apt['doctor']['id'];
        $patientId = (int)$apt['patient']['id'];

        $feedbackId = $this->repository->create([
            'appointment_id' => $appointmentId,
            'patient_id' => $patientId,
            'doctor_id' => $doctorId,
            'rating' => $rating,
            'comment' => $comment ?: null,
            'tags' => $tags
        ]);

        // Notify doctor of new feedback
        try {
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
        } catch (\Throwable $e) {
            // Non-critical notification failure ignored
        }

        // Invalidate doctor cache, admin stats, and feedback queries
        $this->notificationService->publishDataChanged([$patientId, $doctorId], ['doctors', 'feedback', 'appointments']);

        $createdAt = date('Y-m-d H:i:s');
        $editableUntilTs = time() + (self::EDIT_WINDOW_DAYS * 86400);

        return [
            'id' => $feedbackId,
            'appointmentId' => $appointmentId,
            'rating' => $rating,
            'comment' => $comment,
            'tags' => $tags ?: [],
            'createdAt' => $createdAt,
            'editableUntil' => date('c', $editableUntilTs),
            'isEditable' => true,
            'message' => 'Thank you! Your feedback has been recorded.'
        ];
    }

    /**
     * Get feedback for a specific appointment
     */
    public function getAppointmentFeedback(int $appointmentId, array $user): array {
        $apt = $this->appointmentRepository->findById($appointmentId);
        if (!$apt) {
            throw new Exception('Appointment not found.', 404);
        }

        $existing = $this->repository->findByAppointmentId($appointmentId);
        if (!$existing) {
            throw new Exception('No review found for this appointment.', 404);
        }

        // Check view permission
        if ($user['role'] === 'patient' && (int)$existing['patient_id'] !== (int)$user['id']) {
            throw new Exception('Unauthorized to view this review.', 403);
        }

        $createdAtTs = strtotime($existing['created_at']);
        $editableUntilTs = $createdAtTs + (self::EDIT_WINDOW_DAYS * 86400);
        $isEditable = time() <= $editableUntilTs;

        $tags = !empty($existing['tags']) ? (is_string($existing['tags']) ? json_decode($existing['tags'], true) : $existing['tags']) : [];

        return [
            'id' => (int)$existing['id'],
            'appointmentId' => (int)$existing['appointment_id'],
            'patientId' => (int)$existing['patient_id'],
            'doctorId' => (int)$existing['doctor_id'],
            'rating' => (int)$existing['rating'],
            'comment' => $existing['comment'],
            'tags' => $tags,
            'createdAt' => $existing['created_at'],
            'updatedAt' => $existing['updated_at'] ?? null,
            'editableUntil' => date('c', $editableUntilTs),
            'isEditable' => $isEditable,
        ];
    }

    /**
     * Edit feedback (within 7 days of creation, owning patient only)
     */
    public function updateAppointmentFeedback(int $appointmentId, array $data, array $user): array {
        $apt = $this->appointmentRepository->findById($appointmentId);
        if (!$apt) {
            throw new Exception('Appointment not found.', 404);
        }

        $existing = $this->repository->findByAppointmentId($appointmentId);
        if (!$existing) {
            throw new Exception('No review exists for this appointment.', 404);
        }

        if ($user['role'] !== 'patient' || (int)$existing['patient_id'] !== (int)$user['id']) {
            throw new Exception('Only the patient who submitted this review can edit it.', 403);
        }

        // Check 7-day edit window
        $createdAtTs = strtotime($existing['created_at']);
        if (time() > $createdAtTs + (self::EDIT_WINDOW_DAYS * 86400)) {
            throw new Exception('Reviews can only be edited within ' . self::EDIT_WINDOW_DAYS . ' days of creation.', 403);
        }

        $rating = (int)($data['rating'] ?? $existing['rating']);
        if ($rating < 1 || $rating > 5) {
            throw new Exception('Rating must be an integer between 1 and 5 stars.', 422);
        }

        $rawComment = isset($data['comment']) ? trim($data['comment']) : ($existing['comment'] ?? '');
        $comment = strip_tags($rawComment);
        if (mb_strlen($comment) > 500) {
            throw new Exception('Comment must not exceed 500 characters.', 422);
        }

        // Optional quick tags
        $tags = null;
        if (isset($data['tags']) && is_array($data['tags'])) {
            $tags = array_values(array_filter(array_map('trim', $data['tags']), fn($t) => is_string($t) && $t !== ''));
        } elseif (isset($existing['tags'])) {
            $tags = is_string($existing['tags']) ? json_decode($existing['tags'], true) : $existing['tags'];
        }

        $this->repository->update((int)$existing['id'], [
            'rating' => $rating,
            'comment' => $comment ?: null,
            'tags' => $tags
        ]);

        $this->notificationService->publishDataChanged([(int)$existing['patient_id'], (int)$existing['doctor_id']], ['doctors', 'feedback', 'appointments']);

        return $this->getAppointmentFeedback($appointmentId, $user);
    }

    /**
     * Delete feedback for an appointment (within 7 days for patient, or anytime for admin)
     */
    public function deleteAppointmentFeedback(int $appointmentId, array $user): bool {
        $apt = $this->appointmentRepository->findById($appointmentId);
        if (!$apt) {
            throw new Exception('Appointment not found.', 404);
        }

        $existing = $this->repository->findByAppointmentId($appointmentId);
        if (!$existing) {
            throw new Exception('No review exists for this appointment.', 404);
        }

        if ($user['role'] === 'patient') {
            if ((int)$existing['patient_id'] !== (int)$user['id']) {
                throw new Exception('Only the patient who submitted this review can delete it.', 403);
            }
            $createdAtTs = strtotime($existing['created_at']);
            if (time() > $createdAtTs + (self::EDIT_WINDOW_DAYS * 86400)) {
                throw new Exception('Reviews can only be deleted within ' . self::EDIT_WINDOW_DAYS . ' days of creation.', 403);
            }
        } elseif ($user['role'] !== 'admin') {
            throw new Exception('Unauthorized to delete reviews.', 403);
        }

        $deleted = $this->repository->delete((int)$existing['id']);

        if ($deleted) {
            $this->notificationService->publishDataChanged([(int)$existing['patient_id'], (int)$existing['doctor_id']], ['doctors', 'feedback', 'appointments']);
        }

        return $deleted;
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
        $patientId = (int)$existing['patient_id'];
        $deleted = $this->repository->delete($id);

        if ($deleted) {
            $this->notificationService->publishDataChanged([$patientId, $doctorId], ['doctors', 'feedback', 'appointments']);
        }

        return $deleted;
    }
}
