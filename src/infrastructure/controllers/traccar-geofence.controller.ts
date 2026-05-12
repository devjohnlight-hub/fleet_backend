import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TraccarGeofenceService } from '../../core/application/services/traccar-geofence.service';
import { CreateTraccarGeofenceDto } from '../../core/application/dtos/create-traccar-geofence.dto';
import { UpdateTraccarGeofenceDto } from '../../core/application/dtos/update-traccar-geofence.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('traccar/geofences')
export class TraccarGeofenceController {
  constructor(private readonly traccarGeofenceService: TraccarGeofenceService) {}

  @Get()
  findAll(
    @Query('all') all?: string,
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.traccarGeofenceService.findAll({
      all: all !== undefined ? all === 'true' : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      deviceId: deviceId !== undefined ? Number(deviceId) : undefined,
      groupId: groupId !== undefined ? Number(groupId) : undefined,
    });
  }

  @Post()
  create(@Body() dto: CreateTraccarGeofenceDto) {
    return this.traccarGeofenceService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarGeofenceDto,
  ) {
    return this.traccarGeofenceService.update(id, dto as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.traccarGeofenceService.delete(id);
  }
}
