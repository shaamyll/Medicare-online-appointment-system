/**
 * Medi-Care Singleton WebSocket Client Manager
 * Manages connection lifecycle, JWT auth handshake, auto-reconnect with exponential backoff,
 * heartbeat, and event dispatching.
 */

type EventHandler = (data: any) => void;
type StatusHandler = (isConnected: boolean) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isExplicitClose = false;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private statusListeners: Set<StatusHandler> = new Set();
  private authenticated = false;

  public connect(token: string): void {
    if (!token) return;

    this.token = token;
    this.isExplicitClose = false;

    // If socket is already open with the same token, do not re-create
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.authenticated) {
        return;
      }
    }

    this.cleanupSocket();

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Reset exponential backoff on successful connect
        this.reconnectDelay = 1000;

        // Send auth handshake as FIRST message
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.token) {
          this.ws.send(JSON.stringify({
            type: 'auth',
            token: this.token,
          }));
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          const type = message?.type;

          if (type === 'auth_ok') {
            this.authenticated = true;
            this.notifyStatus(true);
            return;
          }

          if (type === 'auth_error' || type === 'auth_timeout') {
            this.authenticated = false;
            this.notifyStatus(false);
            return;
          }

          if (type === 'ping') {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'pong' }));
            }
            return;
          }

          // Dispatch event to subscribers
          if (type && this.listeners.has(type)) {
            const handlers = this.listeners.get(type);
            handlers?.forEach((handler) => {
              try {
                handler(message);
              } catch (err) {
                console.error(`[WebSocket] Error in handler for event '${type}':`, err);
              }
            });
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        this.authenticated = false;
        this.notifyStatus(false);

        if (!this.isExplicitClose && this.token) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // Socket error - will trigger onclose automatically
        this.authenticated = false;
      };
    } catch (err) {
      console.error('[WebSocket] Connect error:', err);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitClose = true;
    this.token = null;
    this.authenticated = false;
    this.clearReconnectTimer();
    this.cleanupSocket();
    this.notifyStatus(false);
  }

  public subscribe(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusListeners.add(handler);
    // Send immediate initial status
    handler(this.isConnected());
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  public isConnected(): boolean {
    return Boolean(this.ws && this.ws.readyState === WebSocket.OPEN && this.authenticated);
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitClose && this.token) {
        this.connect(this.token);
      }
    }, this.reconnectDelay);

    // Exponential backoff capped at 30 seconds
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private cleanupSocket(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  private notifyStatus(connected: boolean): void {
    this.statusListeners.forEach((handler) => {
      try {
        handler(connected);
      } catch (err) {
        console.error('[WebSocket] Status listener error:', err);
      }
    });
  }
}

export const socketClient = new WebSocketManager();
