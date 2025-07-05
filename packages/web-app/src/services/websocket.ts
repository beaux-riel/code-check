import { WebSocketMessage } from '../types';

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string = 'ws://localhost:3001'): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected', true);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('connected', false);
        this.handleReconnect(url);
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.emit(message.type, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', new Error('WebSocket connection failed'));
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.emit(
        'error',
        error instanceof Error ? error : new Error('WebSocket creation failed')
      );
    }
  }

  private handleReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        this.connect(url);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Failed to reconnect to WebSocket'));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const eventListeners = this.listeners.get(event)!;
    eventListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    };
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach((callback) => callback(data));
  }

  send(event: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message = {
        type: event,
        data: data,
      };
      this.socket.send(JSON.stringify(message));
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN || false;
  }
}

export const websocketService = new WebSocketService();
