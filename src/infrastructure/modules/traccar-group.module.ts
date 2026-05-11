import { Module } from '@nestjs/common';
import { TraccarGroupController } from '../controllers/traccar-group.controller';
import { TraccarGroupService } from '../../core/application/services/traccar-group.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  controllers: [TraccarGroupController],
  providers: [
    TraccarHttpClient,
    {
      provide: TraccarGroupService,
      useFactory: (client: TraccarHttpClient) => new TraccarGroupService(client),
      inject: [TraccarHttpClient],
    },
  ],
  exports: [TraccarHttpClient],
})
export class TraccarGroupModule {}
