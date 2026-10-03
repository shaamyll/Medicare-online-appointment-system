<?php

namespace App\Modules\Feedback;

use App\Core\Request;
use App\Core\Response;
use Exception;

class FeedbackController {
    private FeedbackService $service;

    public function __construct() {
        $this->service = new FeedbackService();
    }

    public function create(Request $request): void {
        $user = $request->getUser();
        $appointmentId = (int)$request->getRouteParam('id');
        $data = $request->getBody();

        try {
            $result = $this->service->submitFeedback($appointmentId, $data, $user);
            Response::success($result, 'Feedback submitted successfully', 201);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function getDoctorFeedback(Request $request): void {
        $doctorId = (int)$request->getRouteParam('id');
        $page = max(1, (int)($request->getQuery('page') ?: 1));
        $limit = max(1, min(50, (int)($request->getQuery('limit') ?: 10)));

        try {
            $data = $this->service->getDoctorFeedback($doctorId, $page, $limit);
            Response::success($data);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function getDoctorOwnFeedback(Request $request): void {
        $user = $request->getUser();
        $page = max(1, (int)($request->getQuery('page') ?: 1));
        $limit = max(1, min(50, (int)($request->getQuery('limit') ?: 10)));

        try {
            $data = $this->service->getDoctorOwnFeedback($user['id'], $page, $limit);
            Response::success($data);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function getAdminList(Request $request): void {
        $page = max(1, (int)($request->getQuery('page') ?: 1));
        $limit = max(1, min(50, (int)($request->getQuery('limit') ?: 10)));
        $doctorId = $request->getQuery('doctorId') ? (int)$request->getQuery('doctorId') : null;
        $rating = $request->getQuery('rating') ? (int)$request->getQuery('rating') : null;

        $filters = [];
        if ($doctorId) $filters['doctorId'] = $doctorId;
        if ($rating) $filters['rating'] = $rating;

        try {
            $data = $this->service->getAdminFeedbackList($filters, $page, $limit);
            Response::success($data);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function getAppointmentFeedback(Request $request): void {
        $user = $request->getUser();
        $appointmentId = (int)$request->getRouteParam('id');

        try {
            $data = $this->service->getAppointmentFeedback($appointmentId, $user);
            Response::success($data);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function update(Request $request): void {
        $user = $request->getUser();
        $appointmentId = (int)$request->getRouteParam('id');
        $data = $request->getBody();

        try {
            $result = $this->service->updateAppointmentFeedback($appointmentId, $data, $user);
            Response::success($result, 'Feedback updated successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function deletePatientFeedback(Request $request): void {
        $user = $request->getUser();
        $appointmentId = (int)$request->getRouteParam('id');

        try {
            $this->service->deleteAppointmentFeedback($appointmentId, $user);
            Response::success(null, 'Feedback deleted successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function delete(Request $request): void {
        $id = (int)$request->getRouteParam('id');

        try {
            $this->service->deleteFeedback($id);
            Response::success(null, 'Feedback deleted successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }
}
