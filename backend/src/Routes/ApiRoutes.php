<?php

namespace App\Routes;

use App\Core\Router;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Modules\Auth\AuthController;
use App\Modules\Department\DepartmentController;
use App\Modules\Doctor\DoctorController;
use App\Modules\Appointment\AppointmentController;
use App\Modules\Admin\AdminController;
use App\Modules\Payment\PaymentController;
use App\Modules\Feedback\FeedbackController;

class ApiRoutes {
    public static function register(Router $router): void {
        // Health check
        $router->get('/health', function(Request $request) {
            Response::success(['status' => 'healthy', 'time' => date('c')]);
        });

        // Auth
        $router->post('/auth/login', [AuthController::class, 'login']);
        $router->post('/auth/doctor/login', [AuthController::class, 'doctorLogin']);
        $router->post('/auth/register', [AuthController::class, 'register']);
        $router->post('/auth/doctor/register', [AuthController::class, 'doctorRegister']);
        $router->get('/auth/me', [AuthController::class, 'me'], [AuthMiddleware::class]);
        $router->put('/auth/profile', [AuthController::class, 'updateProfile'], [AuthMiddleware::class]);
        $router->put('/patient/profile', [AuthController::class, 'updateProfile'], [AuthMiddleware::class]);

        // Departments (Public viewing)
        $router->get('/departments', [DepartmentController::class, 'index']);
        $router->get('/departments/{id}', [DepartmentController::class, 'show']);

        // Doctors (Public viewing)
        $router->get('/doctors', [DoctorController::class, 'index']);
        $router->get('/doctors/{id}', [DoctorController::class, 'show']);
        $router->get('/doctors/{id}/feedback', [FeedbackController::class, 'getDoctorFeedback']);

        // Available Slots
        $router->get('/appointments/slots', [AppointmentController::class, 'slots']);

        // Appointments (Authenticated: Patient, Doctor, Admin)
        $router->get('/appointments', [AppointmentController::class, 'index'], [AuthMiddleware::class]);
        $router->get('/appointments/{id}', [AppointmentController::class, 'show'], [AuthMiddleware::class]);
        $router->post('/appointments', [AppointmentController::class, 'book'], [
            AuthMiddleware::class,
            fn($req) => RoleMiddleware::hasRole($req, ['patient'])
        ]);
        $router->post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel'], [AuthMiddleware::class]);
        $router->patch('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule'], [AuthMiddleware::class]);

        // Demo Payment
        $router->post('/appointments/{id}/pay', [PaymentController::class, 'pay'], [
            AuthMiddleware::class,
            fn($req) => RoleMiddleware::hasRole($req, ['patient'])
        ]);
        $router->get('/appointments/{id}/receipt', [PaymentController::class, 'receipt'], [AuthMiddleware::class]);

        // Feedback & Reviews (Patient submitting review)
        $router->post('/appointments/{id}/feedback', [FeedbackController::class, 'create'], [
            AuthMiddleware::class,
            fn($req) => RoleMiddleware::hasRole($req, ['patient'])
        ]);

        // Doctor Portal
        $doctorAuth = [
            AuthMiddleware::class,
            fn($req) => RoleMiddleware::hasRole($req, ['doctor'])
        ];
        $router->get('/doctor/schedule', [DoctorController::class, 'getMySchedule'], $doctorAuth);
        $router->put('/doctor/schedule', [DoctorController::class, 'updateMySchedule'], $doctorAuth);
        $router->get('/doctor/profile', [DoctorController::class, 'getMyProfile'], $doctorAuth);
        $router->put('/doctor/profile', [DoctorController::class, 'updateMyProfile'], $doctorAuth);
        $router->post('/doctor/profile', [DoctorController::class, 'updateMyProfile'], $doctorAuth);
        $router->patch('/appointments/{id}/status', [AppointmentController::class, 'updateStatus'], $doctorAuth);
        $router->post('/appointments/{id}/consultation', [AppointmentController::class, 'addConsultation'], $doctorAuth);
        $router->get('/doctor/feedback', [FeedbackController::class, 'getDoctorOwnFeedback'], $doctorAuth);

        // Admin Portal
        $adminAuth = [
            AuthMiddleware::class,
            fn($req) => RoleMiddleware::hasRole($req, ['admin'])
        ];
        $router->get('/admin/stats', [AdminController::class, 'stats'], $adminAuth);
        $router->get('/admin/doctors', [AdminController::class, 'doctors'], $adminAuth);
        $router->get('/admin/doctor-requests', [AdminController::class, 'doctorRequests'], $adminAuth);
        $router->post('/admin/doctors/{id}/approve', [AdminController::class, 'approveDoctor'], $adminAuth);
        $router->post('/admin/doctors/{id}/reject', [AdminController::class, 'rejectDoctor'], $adminAuth);
        $router->patch('/admin/doctors/{id}/status', [AdminController::class, 'toggleDoctorStatus'], $adminAuth);
        $router->get('/admin/doctors/{id}/delete-impact', [AdminController::class, 'deleteImpact'], $adminAuth);
        $router->delete('/admin/doctors/{id}', [AdminController::class, 'deleteDoctor'], $adminAuth);
        $router->get('/admin/patients', [AdminController::class, 'patients'], $adminAuth);
        $router->get('/admin/reports', [AdminController::class, 'reports'], $adminAuth);
        $router->get('/admin/feedback', [FeedbackController::class, 'getAdminList'], $adminAuth);
        $router->delete('/admin/feedback/{id}', [FeedbackController::class, 'delete'], $adminAuth);

        // Department CRUD (Admin only)
        $router->post('/departments', [DepartmentController::class, 'create'], $adminAuth);
        $router->put('/departments/{id}', [DepartmentController::class, 'update'], $adminAuth);
        $router->delete('/departments/{id}', [DepartmentController::class, 'delete'], $adminAuth);

        // Notifications (All authenticated roles)
        $router->get('/notifications', [\App\Modules\Notification\NotificationController::class, 'index'], [AuthMiddleware::class]);
        $router->get('/notifications/unread-count', [\App\Modules\Notification\NotificationController::class, 'unreadCount'], [AuthMiddleware::class]);
        $router->patch('/notifications/{id}/read', [\App\Modules\Notification\NotificationController::class, 'markRead'], [AuthMiddleware::class]);
        $router->post('/notifications/read-all', [\App\Modules\Notification\NotificationController::class, 'markAllRead'], [AuthMiddleware::class]);
        $router->delete('/notifications/{id}', [\App\Modules\Notification\NotificationController::class, 'delete'], [AuthMiddleware::class]);
        $router->delete('/notifications', [\App\Modules\Notification\NotificationController::class, 'clearRead'], [AuthMiddleware::class]);
    }
}
