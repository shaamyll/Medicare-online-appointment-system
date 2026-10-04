<?php

namespace App\Modules\Department;

use App\Core\Request;
use App\Core\Response;
use Exception;

class DepartmentController {
    private DepartmentService $service;

    public function __construct() {
        $this->service = new DepartmentService();
    }

    public function index(Request $request): void {
        $includeInactive = $request->getQuery('all') === 'true';
        $sort = $request->getQuery('sort');
        $order = $request->getQuery('order');
        $departments = $this->service->getAll(!$includeInactive, $sort, $order);
        Response::success($departments);
    }

    public function show(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        try {
            $department = $this->service->getById($id);
            Response::success($department);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 404);
        }
    }

    public function create(Request $request): void {
        try {
            $created = $this->service->create($request->getBody());
            Response::success($created, 'Department created successfully', 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function update(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        try {
            $updated = $this->service->update($id, $request->getBody());
            Response::success($updated, 'Department updated successfully');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function delete(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        try {
            $this->service->delete($id);
            Response::success(null, 'Department deleted successfully');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
}
