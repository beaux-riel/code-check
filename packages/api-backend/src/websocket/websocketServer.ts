import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../services/auditService';
import { AuditWebSocketMessage } from '../types/api';

export function initializeWebSocketServer(
  wss: WebSocketServer,
  prisma: PrismaClient
): void {
  const auditService = new AuditService(prisma);

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', (message: string) => {
      console.log('Received message:', message);
      // You can add message handling logic here if needed
    });

    // Subscribe to audit events and send updates via WebSocket
    const progressListener = (message: AuditWebSocketMessage) => {
      ws.send(JSON.stringify(message));
    };

    auditService.on('audit.progress', progressListener);
    auditService.on('audit.status', progressListener);
    auditService.on('audit.completed', progressListener);
    auditService.on('audit.error', progressListener);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      auditService.off('audit.progress', progressListener);
      auditService.off('audit.status', progressListener);
      auditService.off('audit.completed', progressListener);
      auditService.off('audit.error', progressListener);
    });
  });
}
