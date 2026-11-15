import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FirestoreVehicleService } from '../../core/application/services/firestore-vehicle.service';
import { CreateFirestoreVehicleDto } from '../../core/application/dtos/create-firestore-vehicle.dto';
import { UpdateFirestoreVehicleDto } from '../../core/application/dtos/update-firestore-vehicle.dto';
import { StaffRole } from '../../core/domain/entities/staff-role';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { StaffRoles } from '../decorators/staff-roles.decorator';

// Non utilisé par le mobile (accès Firestore direct) ni par le backoffice (Admin SDK).
// Aucun contrôle de propriétaire → réservé au super_admin.
@UseGuards(StaffAuthGuard)
@StaffRoles(StaffRole.SUPER_ADMIN)
@Controller('vehicles')
export class FirestoreVehicleController {
  constructor(
    private readonly firestoreVehicleService: FirestoreVehicleService,
  ) {}

  @Get()
  findAll(@Query('ownerId') ownerId?: string) {
    if (ownerId) {
      return this.firestoreVehicleService.findByOwnerId(ownerId);
    }
    return this.firestoreVehicleService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.firestoreVehicleService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateFirestoreVehicleDto) {
    return this.firestoreVehicleService.create(dto as any);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFirestoreVehicleDto) {
    return this.firestoreVehicleService.update(id, dto as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.firestoreVehicleService.delete(id);
  }
}
