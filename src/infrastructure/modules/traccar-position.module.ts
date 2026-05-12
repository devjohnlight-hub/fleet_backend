import { Module } from '@nestjs/common';
import { TraccarPositionController } from '../controllers/traccar-position.controller';
import { TraccarPositionService } from '../../core/application/services/traccar-position.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  controllers: [TraccarPositionController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarPositionService,
      useFactory: (client: TraccarHttpClient) => new TraccarPositionService(client),
      inject: [TraccarHttpClient],
    },
  ],
})
export class TraccarPositionModule {}
