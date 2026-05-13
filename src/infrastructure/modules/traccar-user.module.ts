import { Module } from '@nestjs/common';
import { TraccarSharedModule } from './traccar-shared.module';
import { TraccarUserController } from '../controllers/traccar-user.controller';
import { TraccarUserService } from '../../core/application/services/traccar-user.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';
import { FirestoreUserService } from '../../core/application/services/firestore-user.service';
import { FirestoreService } from '../firebase/firestore.service';

@Module({
  imports: [TraccarSharedModule],
  controllers: [TraccarUserController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarUserService,
      useFactory: (client: TraccarHttpClient) => new TraccarUserService(client),
      inject: [TraccarHttpClient],
    },
    {
      provide: FirestoreUserService,
      useFactory: (firestoreService: FirestoreService) =>
        new FirestoreUserService(firestoreService),
      inject: [FirestoreService],
    },
  ],
})
export class TraccarUserModule {}
