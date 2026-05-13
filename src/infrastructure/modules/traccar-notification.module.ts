import { Module } from '@nestjs/common';
import { TraccarSharedModule } from './traccar-shared.module';
import { TraccarNotificationController } from '../controllers/traccar-notification.controller';
import { TraccarNotificationService } from '../../core/application/services/traccar-notification.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  imports: [TraccarSharedModule],
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
