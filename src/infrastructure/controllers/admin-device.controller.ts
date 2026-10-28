import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AdminDeviceService } from '../../core/application/services/admin-device.service';
import {
  AdminDevicePositionsQueryDto,
  AdminDevicesQueryDto,
} from '../../core/application/dtos/admin-devices-query.dto';
import { StaffAuthGuard } from '../guards/staff-auth.guard';

// Lecture seule : tout rôle staff
@UseGuards(StaffAuthGuard)
@Controller('admin/v1/devices')
export class AdminDeviceController {
  constructor(private readonly adminDeviceService: AdminDeviceService) {}

  @Get()
  list(@Query() query: AdminDevicesQueryDto) {
    return this.adminDeviceService.list(query);
  }

  @Get(':deviceId')
  findOne(@Param('deviceId', ParseIntPipe) deviceId: number) {
    return this.adminDeviceService.findOne(deviceId);
  }

  @Get(':deviceId/positions')
  findPositions(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Query() query: AdminDevicePositionsQueryDto,
  ) {
    return this.adminDeviceService.findPositions(deviceId, query);
  }
}
