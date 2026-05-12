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
import { TraccarDriverService } from '../../core/application/services/traccar-driver.service';
import { CreateTraccarDriverDto } from '../../core/application/dtos/create-traccar-driver.dto';
import { UpdateTraccarDriverDto } from '../../core/application/dtos/update-traccar-driver.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('traccar/drivers')
export class TraccarDriverController {
  constructor(private readonly traccarDriverService: TraccarDriverService) {}

  @Get()
  findAll(
    @Query('all') all?: string,
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.traccarDriverService.findAll({
      all: all !== undefined ? all === 'true' : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      deviceId: deviceId !== undefined ? Number(deviceId) : undefined,
      groupId: groupId !== undefined ? Number(groupId) : undefined,
    });
  }

  @Post()
  create(@Body() dto: CreateTraccarDriverDto) {
    return this.traccarDriverService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarDriverDto,
  ) {
    return this.traccarDriverService.update(id, dto as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.traccarDriverService.delete(id);
  }
}
