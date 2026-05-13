import { Module } from '@nestjs/common';
import { TraccarSharedModule } from './traccar-shared.module';
import { TraccarDriverController } from '../controllers/traccar-driver.controller';
import { TraccarDriverService } from '../../core/application/services/traccar-driver.service';
import { TraccarHttpClient } from '../traccar/traccar-http.client';

@Module({
  imports: [TraccarSharedModule],
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
