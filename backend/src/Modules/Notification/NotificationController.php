<?php

namespace App\Modules\Notification;

use App\Core\Request;
use App\Core\Response;
use Exception;

class NotificationController
{
    private NotificationRepository $repo;

    public function __construct()
    {
        $this->repo = new NotificationRepository();
    }

    /**
     * GET /api/notifications
     * Query params: page (int >= 1), limit (int 1..50), filter ('all'|'unread')
     */
    public function index(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }

        $page = max(1, (int) ($request->getQuery('page') ?: 1));
        $limit = min(50, max(1, (int) ($request->getQuery('limit') ?: 10)));
        $filter = $request->getQuery('filter') === 'unread' ? 'unread' : 'all';

        try {
            $data = $this->repo->paginate($user['id'], $filter, $page, $limit);
            Response::success($data);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/notifications/unread-count
     */
    public function unreadCount(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }

        try {
            $count = $this->repo->countUnread($user['id']);
            Response::success(['unreadCount' => $count]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * PATCH /api/notifications/{id}/read
     */
    public function markRead(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }

        $id = (int) $request->getRouteParam('id');
        if ($id <= 0) {
            Response::error('Invalid notification ID', 400);
            return;
        }

        try {
            $existing = $this->repo->find($id, $user['id']);
            if (!$existing) {
                Response::error('Notification not found', 404);
                return;
            }

            $this->repo->markRead($id, $user['id']);
            $newUnread = $this->repo->countUnread($user['id']);

            Response::success([
                'id' => $id,
                'isRead' => true,
                'unreadCount' => $newUnread,
            ], 'Notification marked as read');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * POST /api/notifications/read-all
     */
    public function markAllRead(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }

        try {
            $updated = $this->repo->markAllRead($user['id']);
            Response::success([
                'updated' => $updated,
                'unreadCount' => 0,
            ], 'All notifications marked as read');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/notifications/{id}
     */
    public function delete(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }

        $id = (int) $request->getRouteParam('id');
        if ($id <= 0) {
            Response::error('Invalid notification ID', 400);
            return;
        }

        try {
            $existing = $this->repo->find($id, $user['id']);
            if (!$existing) {
                Response::error('Notification not found', 404);
                return;
            }

            $this->repo->delete($id, $user['id']);
            $newUnread = $this->repo->countUnread($user['id']);

            Response::success([
                'id' => $id,
                'unreadCount' => $newUnread,
            ], 'Notification deleted');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/notifications  (clear all read ones)
     */
    public function clearRead(Request $request): void
    {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }

        try {
            $deleted = $this->repo->deleteAllRead($user['id']);
            $newUnread = $this->repo->countUnread($user['id']);

            Response::success([
                'deleted' => $deleted,
                'unreadCount' => $newUnread,
            ], 'Read notifications cleared');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
}
