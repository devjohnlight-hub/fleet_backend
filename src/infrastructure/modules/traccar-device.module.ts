import { Module } from '@nestjs/common';
import { TraccarDeviceController } from '../controllers/traccar-device.controller';
import { TraccarDeviceService } from '../../core/application/services/traccar-device.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  controllers: [TraccarDeviceController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarDeviceService,
      useFactory: (client: TraccarHttpClient) => new TraccarDeviceService(client),
      inject: [TraccarHttpClient],
    },
  ],
})
export class TraccarDeviceModule {}
