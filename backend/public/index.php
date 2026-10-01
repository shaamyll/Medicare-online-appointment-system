<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Routes\ApiRoutes;

// Initialize Environment Variables
Database::loadEnv();

// Error reporting settings
error_reporting(E_ALL);
ini_set('display_errors', '0');

set_exception_handler(function (\Throwable $e) {
    Response::error($e->getMessage(), 500);
});

// Setup Router & Request
$router = new Router();
$request = new Request();

// Register Routes
ApiRoutes::register($router);

// Dispatch
$router->dispatch($request);
