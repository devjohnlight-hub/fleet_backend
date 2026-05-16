import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TraccarDeviceService } from '../../core/application/services/traccar-device.service';
import { FirestoreVehicleService } from '../../core/application/services/firestore-vehicle.service';
import {
  TraccarCredentials,
  TraccarHttpClient,
} from '../traccar/traccar-http.client';
import { CreateTraccarDeviceDto } from '../../core/application/dtos/create-traccar-device.dto';
import { UpdateTraccarDeviceDto } from '../../core/application/dtos/update-traccar-device.dto';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { TraccarLinkedGuard } from '../guards/traccar-linked.guard';

@UseGuards(FirebaseAuthGuard, TraccarLinkedGuard)
@Controller('traccar/devices')
export class TraccarDeviceController {
  constructor(
    private readonly traccarDeviceService: TraccarDeviceService,
    private readonly firestoreVehicleService: FirestoreVehicleService,
    private readonly traccarHttpClient: TraccarHttpClient,
  ) {}

  private creds(req: Request): TraccarCredentials {
    const user = req['user'] as {
      traccarEmail: string;
      traccarPassword: string;
    };
    return { email: user.traccarEmail, password: user.traccarPassword };
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('all') all?: string,
    @Query('userId') userId?: string,
    @Query('id') id?: string,
    @Query('uniqueId') uniqueId?: string,
  ) {
    const connectedTraccarUserId = (req['user'] as { traccarUserId: number })
      .traccarUserId;

    return this.traccarDeviceService.findAll(
      {
        all: all !== undefined ? all === 'true' : undefined,
        userId: userId !== undefined ? Number(userId) : connectedTraccarUserId,
        id: id !== undefined ? Number(id) : undefined,
        uniqueId,
      },
      this.creds(req),
    );
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateTraccarDeviceDto) {
    const { vehiculeId, ...deviceData } = dto;
    const traccarUserId = (req['user'] as { traccarUserId: number })
      .traccarUserId;

    const device = await this.traccarDeviceService.create(deviceData);
    await Promise.all([
      this.traccarHttpClient.linkDeviceToUser(traccarUserId, device.getId()),
      this.firestoreVehicleService.update(vehiculeId, {
        deviceId: device.getId(),
        uniqueId: device.getUniqueId(),
      }),
    ]);
    return device;
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarDeviceDto,
  ) {
    const device = await this.traccarDeviceService.update(
      id,
      dto,
      this.creds(req),
    );

    if (dto.uniqueId !== undefined) {
      const vehicle = await this.firestoreVehicleService.findByDeviceId(id);
      if (vehicle) {
        await this.firestoreVehicleService.update(vehicle.getId(), {
          uniqueId: dto.uniqueId,
        });
      }
    }

    return device;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    await this.traccarDeviceService.delete(id, this.creds(req));

    const vehicle = await this.firestoreVehicleService.findByDeviceId(id);
    if (vehicle) {
      await this.firestoreVehicleService.update(vehicle.getId(), {
        deviceId: null,
        uniqueId: null,
      });
    }

    return { message: `Device ${id} supprimé avec succès.` };
  }
}
