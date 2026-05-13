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
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@UseGuards(FirebaseAuthGuard)
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
