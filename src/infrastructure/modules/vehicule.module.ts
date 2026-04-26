import { Module } from '@nestjs/common';
import { VehiculeController } from '../controllers/vehicule.controller';
import { VehiculeService } from '../../core/application/services/vehicule.service';
import { PrismaService } from '../persistence/prisma.service';
import { VehiculeRepository } from '../persistence/vehicule.repository';

@Module({
  controllers: [VehiculeController],
  providers: [
    PrismaService,
    VehiculeRepository,
    {
      provide: VehiculeService,
      useFactory: (repo: VehiculeRepository) => new VehiculeService(repo),
      inject: [VehiculeRepository],
    },
  ],
})
export class VehiculeModule {}
