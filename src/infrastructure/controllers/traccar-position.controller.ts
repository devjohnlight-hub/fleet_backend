import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TraccarPositionService } from '../../core/application/services/traccar-position.service';
import { TraccarCredentials } from '../traccar/traccar-http.client';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { TraccarLinkedGuard } from '../guards/traccar-linked.guard';

@UseGuards(FirebaseAuthGuard, TraccarLinkedGuard)
@Controller('traccar/positions')
export class TraccarPositionController {
  constructor(private readonly traccarPositionService: TraccarPositionService) {}

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
    @Query('deviceId') deviceId?: string,
    @Query('id') id?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.traccarPositionService.findAll(
      {
        deviceId: deviceId !== undefined ? Number(deviceId) : undefined,
        id: id !== undefined ? Number(id) : undefined,
        from,
        to,
      },
      this.creds(req),
    );
  }
}
