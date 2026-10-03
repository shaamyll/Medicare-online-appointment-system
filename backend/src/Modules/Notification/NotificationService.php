<?php

namespace App\Modules\Notification;

use App\Config\Database;
use PDO;

class NotificationService
{
    private NotificationRepository $repo;
    private PDO $db;
    private string $internalWsUrl;
    private string $internalSecret;

    public function __construct()
    {
        $this->repo = new NotificationRepository();
        $this->db = Database::getConnection();

        $host = getenv('WS_HOST') ?: '127.0.0.1';
        $internalPort = getenv('WS_INTERNAL_PORT') ?: '8081';
        $this->internalWsUrl = "http://{$host}:{$internalPort}/publish";
        $this->internalSecret = getenv('WS_INTERNAL_SECRET') ?: 'medicare_ws_internal_secret_998877_secure';
    }

    /**
     * Create and dispatch a single notification
     */
    public function notify(
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?string $link = null
    ): array {
        $id = $this->repo->create($userId, $type, $title, $message, $data, $link);
        $record = $this->repo->find($id, $userId);

        if (!$record) {
            $record = [
                'id' => $id,
                'userId' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
                'link' => $link,
                'isRead' => false,
                'readAt' => null,
                'createdAt' => date('Y-m-d H:i:s'),
            ];
        }

        $unreadCount = $this->repo->countUnread($userId);

        // Publish realtime event to WebSocket server
        $this->publish([$userId], 'notification', $record, $unreadCount);

        return $record;
    }

    /**
     * Notify multiple users with the same content
     */
    public function notifyMany(
        array $userIds,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?string $link = null
    ): array {
        $records = [];
        foreach (array_unique($userIds) as $uid) {
            $records[] = $this->notify((int) $uid, $type, $title, $message, $data, $link);
        }
        return $records;
    }

    /**
     * Notify all active administrators
     */
    public function notifyAdmins(
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?string $link = null
    ): array {
        $stmt = $this->db->query("
            SELECT id FROM users
            WHERE role = 'admin' AND status = 'active'
        ");
        $adminIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($adminIds)) {
            return [];
        }

        return $this->notifyMany($adminIds, $type, $title, $message, $data, $link);
    }

    /**
     * Force logout a user session in real-time (e.g. on account deactivation or deletion)
     */
    public function publishForceLogout(int $userId, string $reason = 'Account status changed'): void
    {
        $this->publish([$userId], 'force_logout', [
            'userId' => $userId,
            'reason' => $reason,
        ]);
    }

    /**
     * Publish query cache invalidation instructions across connected user tabs
     */
    public function publishDataChanged(array $userIds, array $queryKeys): void
    {
        $this->publish($userIds, 'data_changed', [
            'queryKeys' => $queryKeys,
        ]);
    }

    /**
     * Internal cURL publish bridge to the WebSocket daemon
     * Guaranteed to never throw or break main HTTP request pipeline.
     */
    private function publish(
        array $userIds,
        string $event,
        array $payload,
        ?int $unreadCount = null
    ): void {
        try {
            $body = [
                'userIds' => array_values(array_map('intval', $userIds)),
                'event' => $event,
                'payload' => $payload,
            ];

            if ($unreadCount !== null) {
                $body['unreadCount'] = $unreadCount;
            }

            $jsonBody = json_encode($body, JSON_UNESCAPED_UNICODE);

            $ch = curl_init($this->internalWsUrl);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $jsonBody,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'X-Internal-Secret: ' . $this->internalSecret,
                ],
                CURLOPT_TIMEOUT_MS => 1000,        // 1 second timeout
                CURLOPT_CONNECTTIMEOUT_MS => 500,  // 500ms connect timeout
            ]);

            curl_exec($ch);
            curl_close($ch);
        } catch (\Throwable $e) {
            // Log only, failure to broadcast over socket must never fail main request
            error_log('[NotificationService::publish error] ' . $e->getMessage());
        }
    }
}
