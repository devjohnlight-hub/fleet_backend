import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as admin from 'firebase-admin';
import { FirestoreUserService } from '../../core/application/services/firestore-user.service';
import { TraccarWebsocketService } from '../traccar/traccar-websocket.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class FleetGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FleetGateway.name);
  // firebaseUid → socketId (pour retrouver le client à notifier)
  private readonly userSockets = new Map<string, string>();

  constructor(
    private readonly traccarWsService: TraccarWebsocketService,
    private readonly firestoreUserService: FirestoreUserService,
  ) {}

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() token: string,
  ): Promise<void> {
    let firebaseUid: string;

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      firebaseUid = decoded.uid;
    } catch {
      client.emit('error', 'Token Firebase invalide');
      client.disconnect();
      return;
    }

    const user = await this.firestoreUserService.findById(firebaseUid);
    if (!user || !user.getTraccarPassword()) {
      client.emit('error', 'Aucun compte Traccar associé');
      client.disconnect();
      return;
    }

    this.userSockets.set(firebaseUid, client.id);

    await this.traccarWsService.connect(
      firebaseUid,
      user.getEmail(),
      user.getTraccarPassword()!,
      (event) => {
        const socketId = this.userSockets.get(firebaseUid);
        if (socketId) {
          this.server.to(socketId).emit('traccar_event', event);
        }
      },
    );

    client.emit('subscribed', { status: 'connected' });
    this.logger.log(`Client ${client.id} subscribed as ${firebaseUid}`);
  }

  handleDisconnect(client: Socket): void {
    const entry = [...this.userSockets.entries()].find(
      ([, socketId]) => socketId === client.id,
    );
    if (entry) {
      const [firebaseUid] = entry;
      this.traccarWsService.disconnect(firebaseUid);
      this.userSockets.delete(firebaseUid);
      this.logger.log(`Client ${client.id} disconnected (${firebaseUid})`);
    }
  }
}
