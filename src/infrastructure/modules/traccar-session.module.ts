import { Module } from '@nestjs/common';
import { TraccarSessionController } from '../controllers/traccar-session.controller';
import { TraccarSessionService } from '../../core/application/services/traccar-session.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  controllers: [TraccarSessionController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarSessionService,
      useFactory: (client: TraccarHttpClient) => new TraccarSessionService(client),
      inject: [TraccarHttpClient],
    },
  ],
})
export class TraccarSessionModule {}
