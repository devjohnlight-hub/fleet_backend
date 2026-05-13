import { Module } from '@nestjs/common';
import { FleetGateway } from '../gateways/fleet.gateway';
import { TraccarWebsocketService } from '../traccar/traccar-websocket.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';
import { FirestoreUserService } from '../../core/application/services/firestore-user.service';
import { FirestoreService } from '../firebase/firestore.service';

@Module({
  providers: [
    TraccarHttpClient,
    TraccarWebsocketService,
    {
      provide: FirestoreUserService,
      useFactory: (firestoreService: FirestoreService) =>
        new FirestoreUserService(firestoreService),
      inject: [FirestoreService],
    },
    FleetGateway,
  ],
})
export class FleetWebsocketModule {}
