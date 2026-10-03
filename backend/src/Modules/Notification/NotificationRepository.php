<?php

namespace App\Modules\Notification;

use App\Config\Database;
use PDO;

class NotificationRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Create a notification record scoped to a specific user
     */
    public function create(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $link = null
    ): int {
        $stmt = $this->db->prepare("
            INSERT INTO notifications (user_id, type, title, message, data, link, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
        ");

        $jsonData = $data ? json_encode($data, JSON_UNESCAPED_UNICODE) : null;
        $stmt->execute([
            $userId,
            $type,
            $title,
            $message,
            $jsonData,
            $link,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Find a single notification belonging to a user
     */
    public function find(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM notifications
            WHERE id = ? AND user_id = ?
            LIMIT 1
        ");
        $stmt->execute([$id, $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->mapNotification($row) : null;
    }

    /**
     * Paginate notifications for a user with optional filter ('all' or 'unread')
     */
    public function paginate(int $userId, string $filter = 'all', int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $whereSql = "WHERE user_id = ?";
        $params = [$userId];

        if ($filter === 'unread') {
            $whereSql .= " AND is_read = 0";
        }

        // Get total count matching filter
        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM notifications {$whereSql}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        // Get unread count for the user
        $unreadCount = $this->countUnread($userId);

        // Fetch paginated rows
        $querySql = "
            SELECT * FROM notifications
            {$whereSql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ";
        $stmt = $this->db->prepare($querySql);
        
        // PDO bindValue for integer LIMIT & OFFSET
        $bindIdx = 1;
        foreach ($params as $p) {
            $stmt->bindValue($bindIdx++, $p);
        }
        $stmt->bindValue($bindIdx++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($bindIdx++, $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $items = array_map([$this, 'mapNotification'], $rows);

        $totalPages = $total > 0 ? (int) ceil($total / $limit) : 1;

        return [
            'items' => $items,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => $totalPages,
            'unreadCount' => $unreadCount,
        ];
    }

    /**
     * Count unread notifications for a user
     */
    public function countUnread(int $userId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM notifications
            WHERE user_id = ? AND is_read = 0
        ");
        $stmt->execute([$userId]);
        return (int) $stmt->fetchColumn();
    }

    /**
     * Mark a specific notification as read (scoped to user)
     */
    public function markRead(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare("
            UPDATE notifications
            SET is_read = 1, read_at = NOW()
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$id, $userId]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllRead(int $userId): int
    {
        $stmt = $this->db->prepare("
            UPDATE notifications
            SET is_read = 1, read_at = NOW()
            WHERE user_id = ? AND is_read = 0
        ");
        $stmt->execute([$userId]);
        return $stmt->rowCount();
    }

    /**
     * Delete a single notification (scoped to user)
     */
    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM notifications
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$id, $userId]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Delete all read notifications for a user
     */
    public function deleteAllRead(int $userId): int
    {
        $stmt = $this->db->prepare("
            DELETE FROM notifications
            WHERE user_id = ? AND is_read = 1
        ");
        $stmt->execute([$userId]);
        return $stmt->rowCount();
    }

    /**
     * Map database row to standard camelCase array format
     */
    private function mapNotification(array $row): array
    {
        $data = null;
        if (!empty($row['data'])) {
            $data = is_string($row['data']) ? json_decode($row['data'], true) : $row['data'];
        }

        return [
            'id' => (int) $row['id'],
            'userId' => (int) $row['user_id'],
            'type' => (string) $row['type'],
            'title' => (string) $row['title'],
            'message' => (string) $row['message'],
            'data' => $data,
            'link' => $row['link'] ? (string) $row['link'] : null,
            'isRead' => (bool) $row['is_read'],
            'readAt' => $row['read_at'],
            'createdAt' => $row['created_at'],
        ];
    }
}
