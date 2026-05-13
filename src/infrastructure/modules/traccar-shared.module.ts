import { Module } from '@nestjs/common';
import { TraccarLinkedGuard } from '../guards/traccar-linked.guard';
import { FirestoreUserService } from '../../core/application/services/firestore-user.service';
import { FirestoreService } from '../firebase/firestore.service';

@Module({
  providers: [
    TraccarLinkedGuard,
    {
      provide: FirestoreUserService,
      useFactory: (firestoreService: FirestoreService) =>
        new FirestoreUserService(firestoreService),
      inject: [FirestoreService],
    },
  ],
  exports: [TraccarLinkedGuard, FirestoreUserService],
})
export class TraccarSharedModule {}
