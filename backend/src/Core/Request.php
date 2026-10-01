<?php

namespace App\Core;

class Request {
    private string $method;
    private string $uri;
    private array $headers;
    private array $queryParams;
    private array $body;
    private array $routeParams = [];
    private ?array $user = null;

    public function __construct() {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        
        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
        $parsedUrl = parse_url($requestUri);
        $this->uri = rtrim($parsedUrl['path'] ?? '/', '/');
        if ($this->uri === '') {
            $this->uri = '/';
        }

        $this->queryParams = $_GET;
        $this->headers = $this->extractHeaders();
        $this->body = $this->parseBody();
    }

    private function extractHeaders(): array {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerName = str_replace('_', '-', substr($key, 5));
                $headers[strtolower($headerName)] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['AUTHORIZATION'])) {
            $headers['authorization'] = $_SERVER['AUTHORIZATION'];
        }
        return $headers;
    }

    private function parseBody(): array {
        if ($this->method === 'GET') {
            return [];
        }

        $contentType = $this->headers['content-type'] ?? '';
        if (str_contains(strtolower($contentType), 'application/json')) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            return is_array($data) ? $data : [];
        }

        return $_POST;
    }

    public function getMethod(): string {
        return $this->method;
    }

    public function getUri(): string {
        return $this->uri;
    }

    public function getHeaders(): array {
        return $this->headers;
    }

    public function getHeader(string $name): ?string {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function getQueryParams(): array {
        return $this->queryParams;
    }

    public function getQuery(string $key, mixed $default = null): mixed {
        return $this->queryParams[$key] ?? $default;
    }

    public function getBody(): array {
        return $this->body;
    }

    public function get(string $key, mixed $default = null): mixed {
        return $this->body[$key] ?? $this->queryParams[$key] ?? $default;
    }

    public function setRouteParams(array $params): void {
        $this->routeParams = $params;
    }

    public function getRouteParam(string $key, mixed $default = null): mixed {
        return $this->routeParams[$key] ?? $default;
    }

    public function setUser(?array $user): void {
        $this->user = $user;
    }

    public function getUser(): ?array {
        return $this->user;
    }
}
