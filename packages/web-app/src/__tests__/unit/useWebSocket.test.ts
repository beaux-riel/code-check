import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../hooks/useWebSocket';

// Mock WebSocket
class MockWebSocket {
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = WebSocket.CONNECTING;

  constructor(public url: string) {
    // Simulate connection after a brief delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock implementation
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('useWebSocket Hook', () => {
  const mockUrl = 'ws://localhost:3001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));

    expect(result.current.connectionStatus).toBe('Connecting');
    expect(result.current.lastMessage).toBeNull();
    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('updates connection status when connected', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));

    // Wait for connection to be established
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(result.current.connectionStatus).toBe('Open');
  });

  it('handles incoming messages', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Simulate receiving a message
    const testMessage = { type: 'test', data: 'hello' };
    act(() => {
      const ws = (result.current as any).webSocketRef.current;
      if (ws && ws.onmessage) {
        ws.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify(testMessage),
          })
        );
      }
    });

    expect(result.current.lastMessage).toEqual(testMessage);
  });

  it('sends messages correctly', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    const mockSend = jest.fn();
    const ws = (result.current as any).webSocketRef.current;
    ws.send = mockSend;

    const testMessage = { type: 'ping', data: 'test' };

    act(() => {
      result.current.sendMessage(testMessage);
    });

    expect(mockSend).toHaveBeenCalledWith(JSON.stringify(testMessage));
  });

  it('handles connection errors', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Simulate error
    act(() => {
      const ws = (result.current as any).webSocketRef.current;
      if (ws && ws.onerror) {
        ws.onerror(new Event('error'));
      }
    });

    expect(result.current.connectionStatus).toBe('Closed');
  });

  it('cleans up connection on unmount', () => {
    const { result, unmount } = renderHook(() => useWebSocket(mockUrl));

    const mockClose = jest.fn();
    const ws = (result.current as any).webSocketRef.current;
    ws.close = mockClose;

    unmount();

    expect(mockClose).toHaveBeenCalled();
  });

  it('handles connection close', async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Simulate connection close
    act(() => {
      const ws = (result.current as any).webSocketRef.current;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent('close'));
      }
    });

    expect(result.current.connectionStatus).toBe('Closed');
  });
});
