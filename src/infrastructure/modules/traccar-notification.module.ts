import { Module } from '@nestjs/common';
import { TraccarNotificationController } from '../controllers/traccar-notification.controller';
import { TraccarNotificationService } from '../../core/application/services/traccar-notification.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  controllers: [TraccarNotificationController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarNotificationService,
      useFactory: (client: TraccarHttpClient) => new TraccarNotificationService(client),
      inject: [TraccarHttpClient],
    },
  ],
})
export class TraccarNotificationModule {}
