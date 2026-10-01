<?php

namespace App\Core;

use App\Middleware\CorsMiddleware;

class Router {
    private array $routes = [];

    public function get(string $path, array|callable $handler, array $middlewares = []): void {
        $this->addRoute('GET', $path, $handler, $middlewares);
    }

    public function post(string $path, array|callable $handler, array $middlewares = []): void {
        $this->addRoute('POST', $path, $handler, $middlewares);
    }

    public function put(string $path, array|callable $handler, array $middlewares = []): void {
        $this->addRoute('PUT', $path, $handler, $middlewares);
    }

    public function patch(string $path, array|callable $handler, array $middlewares = []): void {
        $this->addRoute('PATCH', $path, $handler, $middlewares);
    }

    public function delete(string $path, array|callable $handler, array $middlewares = []): void {
        $this->addRoute('DELETE', $path, $handler, $middlewares);
    }

    private function addRoute(string $method, string $path, array|callable $handler, array $middlewares): void {
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . rtrim($pattern, '/') . '$#i';

        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'pattern' => $pattern,
            'handler' => $handler,
            'middlewares' => $middlewares
        ];
    }

    public function dispatch(Request $request): void {
        CorsMiddleware::handle($request);

        $method = $request->getMethod();
        $uri = $request->getUri();

        // Strip prefix /api if exists, but support both /api/... and direct
        $routesToCheck = [$uri];
        if (str_starts_with($uri, '/api')) {
            $routesToCheck[] = substr($uri, 4) ?: '/';
        } else {
            $routesToCheck[] = '/api' . $uri;
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            foreach ($routesToCheck as $checkUri) {
                if (preg_match($route['pattern'], $checkUri, $matches)) {
                    // Extract named parameters
                    $params = [];
                    foreach ($matches as $k => $v) {
                        if (!is_int($k)) {
                            $params[$k] = $v;
                        }
                    }
                    $request->setRouteParams($params);

                    // Execute Middlewares
                    foreach ($route['middlewares'] as $middleware) {
                        if (is_callable($middleware)) {
                            $middleware($request);
                        } elseif (is_string($middleware) && class_exists($middleware)) {
                            $middleware::handle($request);
                        }
                    }

                    // Execute Handler
                    $handler = $route['handler'];
                    if (is_callable($handler)) {
                        $handler($request);
                        return;
                    } elseif (is_array($handler) && count($handler) === 2) {
                        [$controllerClass, $action] = $handler;
                        $controller = new $controllerClass();
                        $controller->$action($request);
                        return;
                    }
                }
            }
        }

        Response::error("Endpoint not found: [{$method}] {$uri}", 404);
    }
}
