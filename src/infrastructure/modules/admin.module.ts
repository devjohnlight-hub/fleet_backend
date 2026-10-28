import { Module } from '@nestjs/common';
import { AdminHealthController } from '../controllers/admin-health.controller';
import { AdminDeviceController } from '../controllers/admin-device.controller';
import { AdminClientController } from '../controllers/admin-client.controller';
import { AdminSubscriptionController } from '../controllers/admin-subscription.controller';
import { AdminStaffController } from '../controllers/admin-staff.controller';
import { AdminAuditLogController } from '../controllers/admin-audit-log.controller';
import { AdminStaffService } from '../../core/application/services/admin-staff.service';
import { AdminClientNoteService } from '../../core/application/services/admin-client-note.service';
import { AdminHealthService } from '../../core/application/services/admin-health.service';
import { AdminDeviceService } from '../../core/application/services/admin-device.service';
import { AdminClientService } from '../../core/application/services/admin-client.service';
import { AdminSubscriptionService } from '../../core/application/services/admin-subscription.service';
import { TraccarDeviceService } from '../../core/application/services/traccar-device.service';
import { TraccarPositionService } from '../../core/application/services/traccar-position.service';
import { AdminAuditService } from '../../core/application/services/admin-audit.service';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';
import { TraccarHttpClient } from '../traccar/traccar-http.client';
import { FirestoreService } from '../firebase/firestore.service';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [
    AdminHealthController,
    AdminDeviceController,
    AdminClientController,
    AdminSubscriptionController,
    AdminStaffController,
    AdminAuditLogController,
  ],
  providers: [
    StaffAuthGuard,
    IdempotencyInterceptor,
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
      ) =>
        new AdminHealthService(firestoreService, redisService, traccarClient),
      inject: [FirestoreService, RedisService, TraccarHttpClient],
    },
    {
      provide: AdminDeviceService,
      useFactory: (
        firestoreService: FirestoreService,
        traccarClient: TraccarHttpClient,
        auditService: AdminAuditService,
      ) =>
        new AdminDeviceService(
          firestoreService,
          new TraccarDeviceService(traccarClient),
          new TraccarPositionService(traccarClient),
          traccarClient,
          auditService,
        ),
      inject: [FirestoreService, TraccarHttpClient, AdminAuditService],
    },
    {
      provide: AdminClientService,
      useFactory: (auditService: AdminAuditService) =>
        new AdminClientService(auditService),
      inject: [AdminAuditService],
    },
    {
      provide: AdminSubscriptionService,
      useFactory: (
        firestoreService: FirestoreService,
        auditService: AdminAuditService,
      ) => new AdminSubscriptionService(firestoreService, auditService),
      inject: [FirestoreService, AdminAuditService],
    },
    {
      provide: AdminStaffService,
      useFactory: (auditService: AdminAuditService) =>
        new AdminStaffService(auditService),
      inject: [AdminAuditService],
    },
    {
      provide: AdminClientNoteService,
      useFactory: (
        firestoreService: FirestoreService,
        auditService: AdminAuditService,
      ) => new AdminClientNoteService(firestoreService, auditService),
      inject: [FirestoreService, AdminAuditService],
    },
  ],
})
export class AdminModule {}
