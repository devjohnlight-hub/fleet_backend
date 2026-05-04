import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VehiculeModule } from './infrastructure/modules/vehicule.module';
import { FileUploadModule } from './infrastructure/modules/file-upload.module';
import { CompanyModule } from './infrastructure/modules/company.module';
import { FleetOwnerModule } from './infrastructure/modules/fleet-owner.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: configService.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
        Storage: new ThrottlerStorageRedisService(
          new Redis({
            host: configService.getOrThrow<string>('REDIS_HOST', 'localhost'),
            port: configService.getOrThrow<number>('REDIS_PORT', 6379),
          }),
        ),
      }),
    }),
    VehiculeModule,
    FileUploadModule,
    CompanyModule,
    FleetOwnerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
