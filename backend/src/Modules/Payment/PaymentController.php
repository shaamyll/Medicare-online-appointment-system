<?php

namespace App\Modules\Payment;

use App\Core\Request;
use App\Core\Response;
use Exception;

class PaymentController {
    private PaymentService $service;

    public function __construct() {
        $this->service = new PaymentService();
    }

    public function pay(Request $request): void {
        $user = $request->getUser();
        $appointmentId = (int)$request->getRouteParam('id');
        $method = $request->get('method') ?? 'upi';

        try {
            $result = $this->service->pay($appointmentId, $method, $user);
            Response::success($result, 'Demo payment processed successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function collect(Request $request): void {
        $user = $request->getUser();
        $appointmentId = (int)$request->getRouteParam('id');

        try {
            $result = $this->service->collectPayment($appointmentId, $user);
            Response::success($result, 'Payment collected successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function receipt(Request $request): void {
        $user = $request->getUser();
        $appointmentId = (int)$request->getRouteParam('id');

        try {
            $receipt = $this->service->getReceipt($appointmentId, $user);
            Response::success($receipt);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }
}
