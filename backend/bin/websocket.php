<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Core\Jwt;
use Ratchet\ConnectionInterface;
use Ratchet\Http\HttpServer as RatchetHttpServer;
use Ratchet\MessageComponentInterface;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Loop;
use React\Http\HttpServer as ReactHttpServer;
use React\Http\Message\Response as HttpResponse;
use React\Socket\SocketServer;
use Psr\Http\Message\ServerRequestInterface;

// Load environment variables
Database::loadEnv();

$wsHost = getenv('WS_HOST') ?: '127.0.0.1';
$wsPort = (int)(getenv('WS_PORT') ?: 8080);
$internalPort = (int)(getenv('WS_INTERNAL_PORT') ?: 8081);
$internalSecret = getenv('WS_INTERNAL_SECRET') ?: 'medicare_ws_internal_secret_998877_secure';
$allowedOriginsStr = getenv('WS_ALLOWED_ORIGINS') ?: 'http://localhost:5173';
$allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $allowedOriginsStr))));

echo "========================================================\n";
echo "  Medi-Care Real-Time WebSocket Server\n";
echo "========================================================\n";
echo "  WebSocket Host:      {$wsHost}:{$wsPort}\n";
echo "  Internal Bridge:     127.0.0.1:{$internalPort}\n";
echo "  Allowed Origins:     " . implode(', ', $allowedOrigins) . "\n";
echo "========================================================\n\n";

class MediCareWebSocketHandler implements MessageComponentInterface
{
    /** @var \SplObjectStorage<ConnectionInterface, mixed> */
    protected \SplObjectStorage $clients;

    /** @var array<int, array<int, ConnectionInterface>> userId => [resourceId => Connection] */
    protected array $userConnections = [];

    /** @var array<int, array{conn: ConnectionInterface, connectedAt: int}> */
    protected array $pendingAuth = [];

    protected array $allowedOrigins;

    private ?\PDO $db = null;

    public function __construct(array $allowedOrigins = [])
    {
        $this->clients = new \SplObjectStorage();
        $this->allowedOrigins = $allowedOrigins;
    }

    private function getDb(): \PDO
    {
        try {
            if ($this->db) {
                // Test connection
                $this->db->query("SELECT 1");
                return $this->db;
            }
        } catch (\Throwable $e) {
            $this->db = null;
        }

        $this->db = Database::getConnection();
        return $this->db;
    }

    public function onOpen(ConnectionInterface $conn): void
    {
        // 1. Validate Origin header if provided
        /** @var \GuzzleHttp\Psr7\Request|null $httpRequest */
        $httpRequest = $conn->httpRequest ?? null;
        if ($httpRequest) {
            $origins = $httpRequest->getHeader('Origin');
            if (!empty($origins) && !empty($this->allowedOrigins)) {
                $clientOrigin = rtrim($origins[0], '/');
                $isAllowed = false;
                foreach ($this->allowedOrigins as $allowed) {
                    if (rtrim($allowed, '/') === $clientOrigin) {
                        $isAllowed = true;
                        break;
                    }
                }

                if (!$isAllowed) {
                    echo "[WS] Connection #{$conn->resourceId} rejected: Origin '{$origins[0]}' not in whitelist.\n";
                    $conn->close();
                    return;
                }
            }
        }

        $this->clients->attach($conn);
        $this->pendingAuth[$conn->resourceId] = [
            'conn' => $conn,
            'connectedAt' => time(),
        ];

        echo "[WS] Connected #{$conn->resourceId} from " . ($conn->remoteAddress ?? 'unknown') . "\n";
    }

    public function onMessage(ConnectionInterface $from, $msg): void
    {
        $data = json_decode((string)$msg, true);
        if (!is_array($data)) {
            return;
        }

        $type = $data['type'] ?? '';

        // 1. Client Authentication handshake
        if ($type === 'auth') {
            $token = $data['token'] ?? '';
            if (empty($token)) {
                $from->send(json_encode([
                    'type' => 'auth_error',
                    'message' => 'Token is required.',
                ]));
                $from->close();
                return;
            }

            $payload = Jwt::decode($token);
            if (!$payload || empty($payload['sub'])) {
                $from->send(json_encode([
                    'type' => 'auth_error',
                    'message' => 'Invalid or expired token.',
                ]));
                $from->close();
                return;
            }

            $userId = (int)$payload['sub'];

            try {
                $stmt = $this->getDb()->prepare("SELECT id, name, role, status FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(\PDO::FETCH_ASSOC);

                if (!$user || $user['status'] !== 'active') {
                    $from->send(json_encode([
                        'type' => 'auth_error',
                        'message' => 'Account is inactive or does not exist.',
                    ]));
                    $from->close();
                    return;
                }

                unset($this->pendingAuth[$from->resourceId]);

                $from->userId = $userId;
                $from->userRole = $user['role'];
                $from->userName = $user['name'];

                if (!isset($this->userConnections[$userId])) {
                    $this->userConnections[$userId] = [];
                }
                $this->userConnections[$userId][$from->resourceId] = $from;

                echo "[WS] Authenticated user #{$userId} ({$user['role']} - {$user['name']}) on connection #{$from->resourceId}\n";

                $from->send(json_encode([
                    'type' => 'auth_ok',
                    'userId' => $userId,
                    'role' => $user['role'],
                ]));
            } catch (\Throwable $e) {
                echo "[WS] Error during auth for user #{$userId}: " . $e->getMessage() . "\n";
                $from->send(json_encode([
                    'type' => 'auth_error',
                    'message' => 'Internal authentication validation failure.',
                ]));
                $from->close();
            }
            return;
        }

        // 2. Heartbeat Ping / Pong
        if ($type === 'ping') {
            $from->send(json_encode([
                'type' => 'pong',
                'timestamp' => time(),
            ]));
            return;
        }
    }

    public function onClose(ConnectionInterface $conn): void
    {
        $this->clients->detach($conn);
        unset($this->pendingAuth[$conn->resourceId]);

        if (isset($conn->userId)) {
            $uid = (int)$conn->userId;
            unset($this->userConnections[$uid][$conn->resourceId]);
            if (empty($this->userConnections[$uid])) {
                unset($this->userConnections[$uid]);
            }
            echo "[WS] Connection #{$conn->resourceId} disconnected (user #{$uid})\n";
        } else {
            echo "[WS] Unauthenticated connection #{$conn->resourceId} disconnected\n";
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e): void
    {
        echo "[WS] Error on connection #{$conn->resourceId}: {$e->getMessage()}\n";
        $conn->close();
    }

    /**
     * Periodically called to disconnect clients that failed to authenticate within 5 seconds
     */
    public function sweepUnauthenticated(): void
    {
        $now = time();
        foreach ($this->pendingAuth as $resourceId => $item) {
            if ($now - $item['connectedAt'] >= 5) {
                echo "[WS] Closing unauthenticated connection #{$resourceId} (timeout > 5s)\n";
                $item['conn']->send(json_encode([
                    'type' => 'auth_timeout',
                    'message' => 'Authentication timed out after 5 seconds.',
                ]));
                $item['conn']->close();
                unset($this->pendingAuth[$resourceId]);
            }
        }
    }

    /**
     * Send heartbeat ping to all connected clients every 30s
     */
    public function sendHeartbeat(): void
    {
        $payload = json_encode(['type' => 'ping', 'timestamp' => time()]);
        foreach ($this->clients as $client) {
            try {
                $client->send($payload);
            } catch (\Throwable $e) {
                // If send fails, let ratchet onClose clean it up
            }
        }
    }

    /**
     * Broadcast an event to specified userIds or all users
     */
    public function broadcastPublish(
        array $userIds,
        string $event,
        array $payload,
        ?int $unreadCount = null
    ): int {
        $msg = [
            'type' => $event,
            'data' => $payload,
        ];
        if ($unreadCount !== null) {
            $msg['unreadCount'] = $unreadCount;
        }
        $json = json_encode($msg, JSON_UNESCAPED_UNICODE);
        $delivered = 0;

        if (empty($userIds)) {
            // Broadcast to all active authenticated sockets
            foreach ($this->userConnections as $uid => $connections) {
                foreach ($connections as $conn) {
                    try {
                        $conn->send($json);
                        $delivered++;
                    } catch (\Throwable $e) {
                        echo "[WS] Failed to send to conn #{$conn->resourceId}: " . $e->getMessage() . "\n";
                    }
                }
            }
        } else {
            foreach ($userIds as $uid) {
                $uid = (int)$uid;
                if (!empty($this->userConnections[$uid])) {
                    foreach ($this->userConnections[$uid] as $conn) {
                        try {
                            $conn->send($json);
                            $delivered++;
                        } catch (\Throwable $e) {
                            echo "[WS] Failed to send to user #{$uid} conn #{$conn->resourceId}: " . $e->getMessage() . "\n";
                        }
                    }
                }
            }
        }

        echo "[WS-BRIDGE] Dispatched event '{$event}' to " . count($userIds) . " user target(s). Delivered to {$delivered} socket(s).\n";

        return $delivered;
    }
}

// ----------------------------------------------------
// Setup ReactPHP Loop & Dual Server Architecture
// ----------------------------------------------------
$loop = Loop::get();
$handler = new MediCareWebSocketHandler($allowedOrigins);

// 1. External Ratchet WebSocket Server (Clients connect here)
$wsSocket = new SocketServer("{$wsHost}:{$wsPort}", [], $loop);
$wsServer = new IoServer(
    new RatchetHttpServer(
        new WsServer($handler)
    ),
    $wsSocket,
    $loop
);

// 2. Internal HTTP Bridge Server (PHP cURL POST /publish binds to localhost)
$internalSocket = new SocketServer("127.0.0.1:{$internalPort}", [], $loop);
$httpServer = new ReactHttpServer($loop, function (ServerRequestInterface $request) use ($handler, $internalSecret) {
    // Only accept POST /publish
    if ($request->getMethod() !== 'POST' || $request->getUri()->getPath() !== '/publish') {
        return new HttpResponse(
            404,
            ['Content-Type' => 'application/json'],
            json_encode(['error' => 'Endpoint not found.'])
        );
    }

    // Verify secret header
    $providedSecret = $request->getHeaderLine('X-Internal-Secret');
    if (!hash_equals($internalSecret, $providedSecret)) {
        return new HttpResponse(
            401,
            ['Content-Type' => 'application/json'],
            json_encode(['error' => 'Unauthorized bridge call. Invalid X-Internal-Secret.'])
        );
    }

    $rawBody = (string)$request->getBody();
    $data = json_decode($rawBody, true);
    if (!is_array($data)) {
        return new HttpResponse(
            400,
            ['Content-Type' => 'application/json'],
            json_encode(['error' => 'Invalid JSON body.'])
        );
    }

    $userIds = $data['userIds'] ?? [];
    $event = $data['event'] ?? 'notification';
    $payload = $data['payload'] ?? [];
    $unreadCount = isset($data['unreadCount']) ? (int)$data['unreadCount'] : null;

    $delivered = $handler->broadcastPublish($userIds, $event, $payload, $unreadCount);

    return new HttpResponse(
        200,
        ['Content-Type' => 'application/json'],
        json_encode([
            'success' => true,
            'delivered' => $delivered,
        ])
    );
});
$httpServer->listen($internalSocket);

// 3. Periodic Timers: Sweep unauthenticated conns (every 1s) and Heartbeat ping (every 30s)
$loop->addPeriodicTimer(1.0, function () use ($handler) {
    $handler->sweepUnauthenticated();
});

$loop->addPeriodicTimer(30.0, function () use ($handler) {
    $handler->sendHeartbeat();
});

echo "WebSocket server listening on ws://{$wsHost}:{$wsPort}\n";
echo "Internal publish bridge listening on http://127.0.0.1:{$internalPort}/publish\n";
echo "Ready for real-time notifications.\n\n";

$loop->run();
