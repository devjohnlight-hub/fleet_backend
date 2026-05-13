import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TraccarPositionService } from '../../core/application/services/traccar-position.service';
import { TraccarDeviceService } from '../../core/application/services/traccar-device.service';
import { TraccarCredentials } from '../traccar/traccar-http.client';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { TraccarLinkedGuard } from '../guards/traccar-linked.guard';

@UseGuards(FirebaseAuthGuard, TraccarLinkedGuard)
@Controller('traccar/positions')
export class TraccarPositionController {
  constructor(
    private readonly traccarPositionService: TraccarPositionService,
    private readonly traccarDeviceService: TraccarDeviceService,
  ) {}

  private creds(req: Request): TraccarCredentials {
    const user = req['user'] as {
      traccarEmail: string;
      traccarPassword: string;
    };
    return { email: user.traccarEmail, password: user.traccarPassword };
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('deviceId') deviceId?: string,
    @Query('id') id?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const creds = this.creds(req);
    const traccarUserId = (req['user'] as { traccarUserId: number }).traccarUserId;

    if (deviceId !== undefined || id !== undefined) {
      return this.traccarPositionService.findAll(
        {
          deviceId: deviceId !== undefined ? Number(deviceId) : undefined,
          id: id !== undefined ? Number(id) : undefined,
          from,
          to,
        },
        creds,
      );
    }

    // Traccar v5+ requires at least deviceId — fetch positions for all user devices
    const devices = await this.traccarDeviceService.findAll(
      { userId: traccarUserId },
      creds,
    );
    const positionsArrays = await Promise.all(
      devices.map((d) =>
        this.traccarPositionService.findAll({ deviceId: d.getId() }, creds),
      ),
    );
    return positionsArrays.flat();
  }
}
