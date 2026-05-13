import { Module } from '@nestjs/common';
import { TraccarSharedModule } from './traccar-shared.module';
import { TraccarGroupController } from '../controllers/traccar-group.controller';
import { TraccarGroupService } from '../../core/application/services/traccar-group.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  imports: [TraccarSharedModule],
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
