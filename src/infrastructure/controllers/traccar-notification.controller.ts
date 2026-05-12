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
import { TraccarNotificationService } from '../../core/application/services/traccar-notification.service';
import { CreateTraccarNotificationDto } from '../../core/application/dtos/create-traccar-notification.dto';
import { UpdateTraccarNotificationDto } from '../../core/application/dtos/update-traccar-notification.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('traccar/notifications')
export class TraccarNotificationController {
  constructor(private readonly traccarNotificationService: TraccarNotificationService) {}

  @Get()
  findAll(
    @Query('all') all?: string,
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('groupId') groupId?: string,
    @Query('refresh') refresh?: string,
  ) {
    return this.traccarNotificationService.findAll({
      all: all !== undefined ? all === 'true' : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      deviceId: deviceId !== undefined ? Number(deviceId) : undefined,
      groupId: groupId !== undefined ? Number(groupId) : undefined,
      refresh: refresh !== undefined ? refresh === 'true' : undefined,
    });
  }

  @Get('types')
  getTypes() {
    return this.traccarNotificationService.getTypes();
  }

  @Get('test/:notificator')
  @HttpCode(HttpStatus.NO_CONTENT)
  sendTest(@Param('notificator') notificator: string) {
    return this.traccarNotificationService.sendTest(notificator);
  }

  @Post()
  create(@Body() dto: CreateTraccarNotificationDto) {
    return this.traccarNotificationService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarNotificationDto,
  ) {
    return this.traccarNotificationService.update(id, dto as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.traccarNotificationService.delete(id);
  }
}
