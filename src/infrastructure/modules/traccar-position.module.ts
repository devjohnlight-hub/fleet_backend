import { Module } from '@nestjs/common';
import { TraccarSharedModule } from './traccar-shared.module';
import { TraccarPositionController } from '../controllers/traccar-position.controller';
import { TraccarPositionService } from '../../core/application/services/traccar-position.service';
import { TraccarDeviceService } from '../../core/application/services/traccar-device.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  imports: [TraccarSharedModule],
  controllers: [TraccarPositionController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarPositionService,
      useFactory: (client: TraccarHttpClient) => new TraccarPositionService(client),
      inject: [TraccarHttpClient],
    },
    {
      provide: TraccarDeviceService,
      useFactory: (client: TraccarHttpClient) => new TraccarDeviceService(client),
      inject: [TraccarHttpClient],
    },
  ],
})
export class TraccarPositionModule {}
