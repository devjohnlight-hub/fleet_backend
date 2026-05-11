import { Module } from '@nestjs/common';
import { TraccarUserController } from '../controllers/traccar-user.controller';
import { TraccarUserService } from '../../core/application/services/traccar-user.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  controllers: [TraccarUserController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarUserService,
      useFactory: (client: TraccarHttpClient) => new TraccarUserService(client),
      inject: [TraccarHttpClient],
    },
  ],
})
export class TraccarUserModule {}
