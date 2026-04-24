type WebSocketMessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, WebSocketMessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;
  private currentUrl = '';

  connect(url: string): Promise<void> {
    if (this.ws && this.currentUrl === url && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.closeSocket(false);
    this.currentUrl = url;

    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);
        this.ws = socket;

        socket.onopen = () => {
          console.log('[WebSocket] 连接成功');
          this.reconnectAttempts = 0;
          resolve();
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const type = data.type;
            const handlers = this.handlers.get(type) || [];
            handlers.forEach((handler) => handler(data));
          } catch (error) {
            console.error('[WebSocket] 解析消息失败:', error);
          }
        };

        socket.onerror = (error) => {
          console.error('[WebSocket] 连接错误:', error);
          reject(error);
        };

        socket.onclose = () => {
          if (this.ws === socket) {
            this.ws = null;
          }
          console.log('[WebSocket] 连接关闭');
          if (this.currentUrl === url) {
            this.reconnect(url);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  on(type: string, handler: WebSocketMessageHandler) {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  off(type: string, handler: WebSocketMessageHandler) {
    const handlers = this.handlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.handlers.set(type, handlers);
    }
  }

  disconnect(clearHandlers = true) {
    this.currentUrl = '';
    this.closeSocket(true);
    if (clearHandlers) {
      this.handlers.clear();
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private reconnect(url: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    this.reconnectAttempts += 1;
    console.log(`[WebSocket] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    window.setTimeout(() => {
      if (this.currentUrl === url) {
        this.connect(url).catch((error) => console.error('[WebSocket] 重连失败:', error));
      }
    }, this.reconnectDelay);
  }

  private closeSocket(resetReconnectAttempts: boolean) {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    if (resetReconnectAttempts) {
      this.reconnectAttempts = 0;
    }
  }
}

export const wsService = new WebSocketService();
