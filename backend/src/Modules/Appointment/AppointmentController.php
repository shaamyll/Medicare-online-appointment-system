<?php

namespace App\Modules\Appointment;

use App\Core\Request;
use App\Core\Response;
use Exception;

class AppointmentController {
    private AppointmentService $service;

    public function __construct() {
        $this->service = new AppointmentService();
    }

    public function index(Request $request): void {
        $user = $request->getUser();
        $status = $request->getQuery('status');
        $date = $request->getQuery('date');
        $doctorId = $request->getQuery('doctorId') ? (int)$request->getQuery('doctorId') : null;
        $sort = $request->getQuery('sort');
        $order = $request->getQuery('order');

        try {
            if ($user['role'] === 'patient') {
                $appointments = $this->service->getPatientAppointments($user['id'], $sort, $order);
            } elseif ($user['role'] === 'doctor') {
                $appointments = $this->service->getDoctorAppointments($user['id'], $status, $sort, $order);
            } else { // admin
                $appointments = $this->service->getAllAppointments($status, $date, $doctorId, $sort, $order);
            }
            Response::success($appointments);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function slots(Request $request): void {
        $doctorId = (int)$request->getQuery('doctorId');
        $date = $request->getQuery('date');

        if (!$doctorId || !$date) {
            Response::error('Doctor ID and Date are required to check slots.', 400);
            return;
        }

        try {
            $slotsData = $this->service->getAvailableSlots($doctorId, $date);
            Response::success($slotsData);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function book(Request $request): void {
        $user = $request->getUser();
        $data = $request->getBody();

        try {
            $appointment = $this->service->bookAppointment($user['id'], $data);
            Response::success($appointment, 'Appointment scheduled successfully', 201);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function show(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        $user = $request->getUser();

        try {
            $apt = $this->service->getAppointmentById($id);
            if (!$apt) {
                Response::error('Appointment not found.', 404);
                return;
            }
            if ($user['role'] === 'patient' && $apt['patient']['id'] !== $user['id']) {
                Response::error('Unauthorized.', 403);
                return;
            }
            if ($user['role'] === 'doctor' && $apt['doctor']['id'] !== $user['id']) {
                Response::error('Unauthorized.', 403);
                return;
            }
            Response::success($apt);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function cancel(Request $request): void {
        $user = $request->getUser();
        $id = (int)$request->getRouteParam('id');
        $reason = $request->get('reason');

        try {
            $appointment = $this->service->cancelAppointment($id, $user, $reason);
            Response::success($appointment, 'Appointment cancelled successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function reschedule(Request $request): void {
        $user = $request->getUser();
        $id = (int)$request->getRouteParam('id');
        $date = $request->get('date') ?? $request->get('appointmentDate');
        $startTime = $request->get('startTime');

        if (!$date || !$startTime) {
            Response::error('Date and startTime are required to reschedule.', 400);
            return;
        }

        try {
            $appointment = $this->service->rescheduleAppointment($id, $date, $startTime, $user);
            Response::success($appointment, 'Appointment rescheduled successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function updateStatus(Request $request): void {
        $user = $request->getUser();
        $id = (int)$request->getRouteParam('id');
        $status = $request->get('status');

        if (!$status) {
            Response::error('Status is required.', 400);
            return;
        }

        $reason = $request->get('reason') ?? $request->get('rejectionReason');

        try {
            $appointment = $this->service->updateStatus($id, $status, $user, $reason);
            Response::success($appointment, "Appointment status updated to {$status}");
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function addConsultation(Request $request): void {
        $user = $request->getUser();
        $id = (int)$request->getRouteParam('id');
        $data = $request->getBody();

        try {
            $appointment = $this->service->addConsultationNotes($id, $user['id'], $data);
            Response::success($appointment, 'Consultation record saved');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }
}
