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
import { TraccarDeviceService } from '../../core/application/services/traccar-device.service';
import { CreateTraccarDeviceDto } from '../../core/application/dtos/create-traccar-device.dto';
import { UpdateTraccarDeviceDto } from '../../core/application/dtos/update-traccar-device.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('traccar/devices')
export class TraccarDeviceController {
  constructor(private readonly traccarDeviceService: TraccarDeviceService) {}

  @Get()
  findAll(
    @Query('all') all?: string,
    @Query('userId') userId?: string,
    @Query('id') id?: string,
    @Query('uniqueId') uniqueId?: string,
  ) {
    return this.traccarDeviceService.findAll({
      all: all !== undefined ? all === 'true' : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      id: id !== undefined ? Number(id) : undefined,
      uniqueId,
    });
  }

  @Post()
  create(@Body() dto: CreateTraccarDeviceDto) {
    return this.traccarDeviceService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarDeviceDto,
  ) {
    return this.traccarDeviceService.update(id, dto as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.traccarDeviceService.delete(id);
  }
}
