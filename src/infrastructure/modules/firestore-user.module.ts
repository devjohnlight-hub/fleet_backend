import { Module } from '@nestjs/common';
import { FirestoreUserController } from '../controllers/firestore-user.controller';
import { FirestoreUserService } from '../../core/application/services/firestore-user.service';
import { FirestoreService } from '../firebase/firestore.service';

@Module({
  controllers: [FirestoreUserController],
  providers: [
    {
      provide: FirestoreUserService,
      useFactory: (firestoreService: FirestoreService) =>
        new FirestoreUserService(firestoreService),
      inject: [FirestoreService],
    },
  ],
})
export class FirestoreUserModule {}
