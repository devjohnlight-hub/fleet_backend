import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VehiculeService } from '../../core/application/services/vehicule.service';
import { CreateVehiculeDto } from '../../core/application/dtos/create-vehicule.dto';
import { VehiculeType } from '../../core/domain/entities/vehicule.types';

@Controller('vehicules')
export class VehiculeController {
  constructor(private readonly vehiculeService: VehiculeService) {}

  @Post()
  async create(@Body() dto: CreateVehiculeDto) {
    return this.vehiculeService.create(
      dto.fleetOwnerId,
      dto.type as VehiculeType,
      dto.immatriculation,
      dto.marque,
      dto.modele,
      dto.annee,
      dto.photoUrl,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.vehiculeService.findById(id);
  }

  @Get('fleet/:fleetOwnerId')
  async findAll(@Param('fleetOwnerId') fleetOwnerId: string) {
    return this.vehiculeService.findAll(fleetOwnerId);
  }
}
