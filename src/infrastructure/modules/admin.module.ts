import { Module } from '@nestjs/common';
import { AdminHealthController } from '../controllers/admin-health.controller';
import { AdminDeviceController } from '../controllers/admin-device.controller';
import { AdminHealthService } from '../../core/application/services/admin-health.service';
import { AdminDeviceService } from '../../core/application/services/admin-device.service';
import { TraccarDeviceService } from '../../core/application/services/traccar-device.service';
import { TraccarPositionService } from '../../core/application/services/traccar-position.service';
import { AdminAuditService } from '../../core/application/services/admin-audit.service';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { TraccarHttpClient } from '../traccar/traccar-http.client';
import { FirestoreService } from '../firebase/firestore.service';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [AdminHealthController, AdminDeviceController],
  providers: [
    StaffAuthGuard,
    TraccarHttpClient,
    {
      provide: AdminAuditService,
      useFactory: (firestoreService: FirestoreService) =>
        new AdminAuditService(firestoreService),
      inject: [FirestoreService],
    },
    {
      provide: AdminHealthService,
      useFactory: (
        firestoreService: FirestoreService,
        redisService: RedisService,
        traccarClient: TraccarHttpClient,
      ) => new AdminHealthService(firestoreService, redisService, traccarClient),
      inject: [FirestoreService, RedisService, TraccarHttpClient],
    },
    {
      provide: AdminDeviceService,
      useFactory: (
        firestoreService: FirestoreService,
        traccarClient: TraccarHttpClient,
      ) =>
        new AdminDeviceService(
          firestoreService,
          new TraccarDeviceService(traccarClient),
          new TraccarPositionService(traccarClient),
        ),
      inject: [FirestoreService, TraccarHttpClient],
    },
  ],
})
export class AdminModule {}
