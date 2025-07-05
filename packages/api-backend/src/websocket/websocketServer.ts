import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../services/auditService';
import { AuditWebSocketMessage } from '../types/api';

// Shared AuditService instance to prevent creating multiple instances
let sharedAuditService: AuditService | null = null;

// Export function to get shared audit service instance
export function getSharedAuditService(prisma: PrismaClient): AuditService {
  if (!sharedAuditService) {
    sharedAuditService = new AuditService(prisma);
  }
  return sharedAuditService;
}

export function initializeWebSocketServer(
  wss: WebSocketServer,
  prisma: PrismaClient
): void {
  // Use shared instance or create one if it doesn't exist
  if (!sharedAuditService) {
    sharedAuditService = new AuditService(prisma);
  }
  const auditService = sharedAuditService;

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
