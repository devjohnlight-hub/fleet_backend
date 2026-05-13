import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';
import { TraccarHttpClient } from './traccar-http.client';

export interface TraccarEvent {
  devices?: unknown[];
  positions?: unknown[];
  events?: unknown[];
}

@Injectable()
export class TraccarWebsocketService implements OnModuleDestroy {
  private readonly logger = new Logger(TraccarWebsocketService.name);
  private readonly connections = new Map<string, WebSocket>();

  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async connect(
    firebaseUid: string,
    email: string,
    password: string,
    onEvent: (event: TraccarEvent) => void,
  ): Promise<void> {
    this.disconnect(firebaseUid);

    const cookie = await this.traccarClient.getSessionCookie(email, password);
    const wsUrl = this.traccarClient.baseUrl
      .replace('http://', 'ws://')
      .replace('https://', 'wss://');

    const ws = new WebSocket(`${wsUrl}/api/socket`, {
      headers: { Cookie: cookie },
    });

    ws.on('open', () => {
      this.logger.log(`Traccar WS connected for user ${firebaseUid}`);
    });

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const event = JSON.parse(data.toString()) as TraccarEvent;
        onEvent(event);
      } catch {
        this.logger.warn(`Failed to parse Traccar WS message for ${firebaseUid}`);
      }
    });

    ws.on('close', () => {
      this.logger.log(`Traccar WS closed for user ${firebaseUid}`);
      this.connections.delete(firebaseUid);
    });

    ws.on('error', (err) => {
      this.logger.error(`Traccar WS error for user ${firebaseUid}: ${err.message}`);
      this.connections.delete(firebaseUid);
    });

    this.connections.set(firebaseUid, ws);
  }

  disconnect(firebaseUid: string): void {
    const ws = this.connections.get(firebaseUid);
    if (ws) {
      ws.close();
      this.connections.delete(firebaseUid);
    }
  }

  onModuleDestroy(): void {
    for (const [uid, ws] of this.connections) {
      ws.close();
      this.connections.delete(uid);
    }
  }
}
