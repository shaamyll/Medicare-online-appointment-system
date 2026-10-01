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

        try {
            if ($user['role'] === 'patient') {
                $appointments = $this->service->getPatientAppointments($user['id']);
            } elseif ($user['role'] === 'doctor') {
                $appointments = $this->service->getDoctorAppointments($user['id'], $status);
            } else { // admin
                $appointments = $this->service->getAllAppointments($status, $date);
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

    public function cancel(Request $request): void {
        $user = $request->getUser();
        $id = (int)$request->getRouteParam('id');

        try {
            $appointment = $this->service->cancelAppointment($id, $user);
            Response::success($appointment, 'Appointment cancelled successfully');
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

        try {
            $appointment = $this->service->updateStatus($id, $status, $user);
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
