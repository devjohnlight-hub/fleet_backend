import { Module } from '@nestjs/common';
import { FirestoreVehicleController } from '../controllers/firestore-vehicle.controller';
import { FirestoreVehicleService } from '../../core/application/services/firestore-vehicle.service';
import { FirestoreService } from '../firebase/firestore.service';

@Module({
  controllers: [FirestoreVehicleController],
  providers: [
    {
      provide: FirestoreVehicleService,
      useFactory: (firestoreService: FirestoreService) =>
        new FirestoreVehicleService(firestoreService),
      inject: [FirestoreService],
    },
  ],
})
export class FirestoreVehicleModule {}
