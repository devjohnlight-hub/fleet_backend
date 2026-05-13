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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TraccarGeofenceService } from '../../core/application/services/traccar-geofence.service';
import { TraccarCredentials } from '../traccar/traccar-http.client';
import { CreateTraccarGeofenceDto } from '../../core/application/dtos/create-traccar-geofence.dto';
import { UpdateTraccarGeofenceDto } from '../../core/application/dtos/update-traccar-geofence.dto';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { TraccarLinkedGuard } from '../guards/traccar-linked.guard';

@UseGuards(FirebaseAuthGuard, TraccarLinkedGuard)
@Controller('traccar/geofences')
export class TraccarGeofenceController {
  constructor(private readonly traccarGeofenceService: TraccarGeofenceService) {}

  private creds(req: Request): TraccarCredentials {
    const user = req['user'] as { traccarEmail: string; traccarPassword: string };
    return { email: user.traccarEmail, password: user.traccarPassword };
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('all') all?: string,
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.traccarGeofenceService.findAll(
      {
        all: all !== undefined ? all === 'true' : undefined,
        userId: userId !== undefined ? Number(userId) : undefined,
        deviceId: deviceId !== undefined ? Number(deviceId) : undefined,
        groupId: groupId !== undefined ? Number(groupId) : undefined,
      },
      this.creds(req),
    );
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateTraccarGeofenceDto) {
    return this.traccarGeofenceService.create(dto, this.creds(req));
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarGeofenceDto,
  ) {
    return this.traccarGeofenceService.update(id, dto as any, this.creds(req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.traccarGeofenceService.delete(id, this.creds(req));
  }
}
