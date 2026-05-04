import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { VehiculeService } from '../../core/application/services/vehicule.service';
import { CreateVehiculeDto } from '../../core/application/dtos/create-vehicule.dto';
import { UpdateVehiculeDto } from '../../core/application/dtos/update-vehicule.dto';

@Controller('vehicules')
export class VehiculeController {
  constructor(private readonly vehiculeService: VehiculeService) {}

  @Post()
  async create(@Body() dto: CreateVehiculeDto) {
    return this.vehiculeService.create(
      dto.fleetOwnerId,
      dto.type,
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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateVehiculeDto) {
    return this.vehiculeService.update(id, dto);
  }

  @Patch(':id/maintenance')
  async mettreEnMaintenance(@Param('id') id: string) {
    return this.vehiculeService.mettreEnMaintenance(id);
  }

  @Patch(':id/activer')
  async activer(@Param('id') id: string) {
    return this.vehiculeService.activer(id);
  }

  @Patch(':id/hors-service')
  async mettreHorsService(@Param('id') id: string) {
    return this.vehiculeService.mettreHorsService(id);
  }
}
