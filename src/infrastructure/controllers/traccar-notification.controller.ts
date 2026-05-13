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
import { TraccarNotificationService } from '../../core/application/services/traccar-notification.service';
import { TraccarCredentials } from '../traccar/traccar-http.client';
import { CreateTraccarNotificationDto } from '../../core/application/dtos/create-traccar-notification.dto';
import { UpdateTraccarNotificationDto } from '../../core/application/dtos/update-traccar-notification.dto';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { TraccarLinkedGuard } from '../guards/traccar-linked.guard';

@UseGuards(FirebaseAuthGuard, TraccarLinkedGuard)
@Controller('traccar/notifications')
export class TraccarNotificationController {
  constructor(private readonly traccarNotificationService: TraccarNotificationService) {}

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
    @Query('deviceId') deviceId?: string,
    @Query('groupId') groupId?: string,
    @Query('refresh') refresh?: string,
  ) {
    return this.traccarNotificationService.findAll(
      {
        all: all !== undefined ? all === 'true' : undefined,
        userId: userId !== undefined ? Number(userId) : undefined,
        deviceId: deviceId !== undefined ? Number(deviceId) : undefined,
        groupId: groupId !== undefined ? Number(groupId) : undefined,
        refresh: refresh !== undefined ? refresh === 'true' : undefined,
      },
      this.creds(req),
    );
  }

  @Get('types')
  getTypes(@Req() req: Request) {
    return this.traccarNotificationService.getTypes(this.creds(req));
  }

  @Get('test/:notificator')
  @HttpCode(HttpStatus.NO_CONTENT)
  sendTest(@Req() req: Request, @Param('notificator') notificator: string) {
    return this.traccarNotificationService.sendTest(notificator, this.creds(req));
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateTraccarNotificationDto) {
    return this.traccarNotificationService.create(dto, this.creds(req));
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarNotificationDto,
  ) {
    return this.traccarNotificationService.update(id, dto as any, this.creds(req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.traccarNotificationService.delete(id, this.creds(req));
  }
}
