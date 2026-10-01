<?php

namespace App\Modules\Department;

use Exception;

class DepartmentService {
    private DepartmentRepository $repository;

    public function __construct() {
        $this->repository = new DepartmentRepository();
    }

    public function getAll(bool $onlyActive = true): array {
        return $this->repository->findAll($onlyActive);
    }

    public function getById(int $id): array {
        $dept = $this->repository->findById($id);
        if (!$dept) {
            throw new Exception('Department not found', 404);
        }
        return $dept;
    }

    public function create(array $data): array {
        if (empty($data['name'])) {
            throw new Exception('Department name is required', 400);
        }
        $id = $this->repository->create($data);
        return $this->repository->findById($id);
    }

    public function update(int $id, array $data): array {
        $this->getById($id); // Check existence
        $this->repository->update($id, $data);
        return $this->repository->findById($id);
    }

    public function delete(int $id): void {
        $this->getById($id);
        $this->repository->delete($id);
    }
}
