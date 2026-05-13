import { Module } from '@nestjs/common';
import { TraccarSharedModule } from './traccar-shared.module';
import { TraccarPositionController } from '../controllers/traccar-position.controller';
import { TraccarPositionService } from '../../core/application/services/traccar-position.service';
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
  ],
})
export class TraccarPositionModule {}
