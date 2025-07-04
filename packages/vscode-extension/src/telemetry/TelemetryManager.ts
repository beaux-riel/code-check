import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/ConfigurationManager';

export interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export class TelemetryManager {
  private events: TelemetryEvent[] = [];
  private sessionId: string;

  constructor(
    private context: vscode.ExtensionContext,
    private configManager: ConfigurationManager
  ) {
    this.sessionId = this.generateSessionId();
  }

  public sendEvent(name: string, properties?: Record<string, any>): void {
    if (!this.configManager.getConfig().enableTelemetry) {
      return;
    }

    const event: TelemetryEvent = {
      name,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        extensionVersion: this.context.extension.packageJSON.version,
        vscodeVersion: vscode.version,
        platform: process.platform,
      },
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    // Keep only the last 100 events to prevent memory issues
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    console.log('Telemetry event:', event);
  }

  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public dispose(): void {
    this.sendEvent('extension.deactivated');
    this.events = [];
  }
}
