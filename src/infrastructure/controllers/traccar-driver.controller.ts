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
import { TraccarDriverService } from '../../core/application/services/traccar-driver.service';
import { TraccarCredentials } from '../traccar/traccar-http.client';
import { CreateTraccarDriverDto } from '../../core/application/dtos/create-traccar-driver.dto';
import { UpdateTraccarDriverDto } from '../../core/application/dtos/update-traccar-driver.dto';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { TraccarLinkedGuard } from '../guards/traccar-linked.guard';

@UseGuards(FirebaseAuthGuard, TraccarLinkedGuard)
@Controller('traccar/drivers')
export class TraccarDriverController {
  constructor(private readonly traccarDriverService: TraccarDriverService) {}

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
    return this.traccarDriverService.findAll(
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
  create(@Req() req: Request, @Body() dto: CreateTraccarDriverDto) {
    return this.traccarDriverService.create(dto, this.creds(req));
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarDriverDto,
  ) {
    return this.traccarDriverService.update(id, dto as any, this.creds(req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.traccarDriverService.delete(id, this.creds(req));
  }
}
