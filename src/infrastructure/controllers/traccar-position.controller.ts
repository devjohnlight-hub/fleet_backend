import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TraccarPositionService } from '../../core/application/services/traccar-position.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('traccar/positions')
export class TraccarPositionController {
  constructor(private readonly traccarPositionService: TraccarPositionService) {}

  @Get()
  findAll(
    @Query('deviceId') deviceId?: string,
    @Query('id') id?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.traccarPositionService.findAll({
      deviceId: deviceId !== undefined ? Number(deviceId) : undefined,
      id: id !== undefined ? Number(id) : undefined,
      from,
      to,
    });
  }
}
