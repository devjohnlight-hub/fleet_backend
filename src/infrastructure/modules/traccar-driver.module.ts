import { Module } from '@nestjs/common';
import { TraccarDriverController } from '../controllers/traccar-driver.controller';
import { TraccarDriverService } from '../../core/application/services/traccar-driver.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  controllers: [TraccarDriverController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarDriverService,
      useFactory: (client: TraccarHttpClient) => new TraccarDriverService(client),
      inject: [TraccarHttpClient],
    },
  ],
})
export class TraccarDriverModule {}
