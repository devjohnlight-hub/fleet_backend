import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { FleetOwnerController } from '../controllers/fleet-owner.controller';
import { FleetOwnerService } from '../../core/application/services/fleet-owner.service';
import { FleetOwnerRepository } from '../persistence/fleet-owner.repository';
import { PrismaService } from '../persistence/prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { GoogleStrategy } from '../auth/google.strategy';
import { FacebookStrategy } from '../auth/facebook.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'secret'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [FleetOwnerController],
  providers: [
    PrismaService,
    FleetOwnerRepository,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    {
      provide: FleetOwnerService,
      useFactory: (repo: FleetOwnerRepository, jwtService: JwtService) =>
        new FleetOwnerService(repo, jwtService),
      inject: [FleetOwnerRepository, JwtService],
    },
  ],
  exports: [JwtStrategy, PassportModule],
})
export class FleetOwnerModule {}
