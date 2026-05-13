import { Module } from '@nestjs/common';
import { TraccarSharedModule } from './traccar-shared.module';
import { TraccarDeviceController } from '../controllers/traccar-device.controller';
import { TraccarDeviceService } from '../../core/application/services/traccar-device.service';
import { FirestoreVehicleService } from '../../core/application/services/firestore-vehicle.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';
import { FirestoreService } from '../firebase/firestore.service';

@Module({
  imports: [TraccarSharedModule],
  controllers: [TraccarDeviceController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarDeviceService,
      useFactory: (client: TraccarHttpClient) => new TraccarDeviceService(client),
      inject: [TraccarHttpClient],
    },
    {
      provide: FirestoreVehicleService,
      useFactory: (firestoreService: FirestoreService) =>
        new FirestoreVehicleService(firestoreService),
      inject: [FirestoreService],
    },
  ],
})
export class TraccarDeviceModule {}
