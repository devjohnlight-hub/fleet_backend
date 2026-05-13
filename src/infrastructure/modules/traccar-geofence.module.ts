import { Module } from '@nestjs/common';
import { TraccarSharedModule } from './traccar-shared.module';
import { TraccarGeofenceController } from '../controllers/traccar-geofence.controller';
import { TraccarGeofenceService } from '../../core/application/services/traccar-geofence.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  imports: [TraccarSharedModule],
  controllers: [TraccarGeofenceController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarGeofenceService,
      useFactory: (client: TraccarHttpClient) => new TraccarGeofenceService(client),
      inject: [TraccarHttpClient],
    },
  ],
})
export class TraccarGeofenceModule {}
