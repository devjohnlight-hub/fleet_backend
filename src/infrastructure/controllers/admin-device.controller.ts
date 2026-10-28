import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminDeviceService } from '../../core/application/services/admin-device.service';
import {
  AdminDevicePositionsQueryDto,
  AdminDevicesQueryDto,
} from '../../core/application/dtos/admin-devices-query.dto';
import {
  AdminLinkDeviceDto,
  AdminReasonDto,
  AdminUpdateDeviceDto,
} from '../../core/application/dtos/admin-mutations.dto';
import { StaffRole, StaffUser } from '../../core/domain/entities/staff-role';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { StaffRoles } from '../decorators/staff-roles.decorator';
import { CurrentStaff } from '../decorators/current-staff.decorator';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

// Lectures : tout rôle staff. Mutations : support et super_admin.
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

  @Patch(':deviceId')
  @StaffRoles(StaffRole.SUPPORT, StaffRole.SUPER_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  update(
    @CurrentStaff() staff: StaffUser,
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() dto: AdminUpdateDeviceDto,
  ) {
    return this.adminDeviceService.update(staff, deviceId, dto);
  }

  @Post(':deviceId/disable')
  @HttpCode(HttpStatus.OK)
  @StaffRoles(StaffRole.SUPPORT, StaffRole.SUPER_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  disable(
    @CurrentStaff() staff: StaffUser,
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() dto: AdminReasonDto,
  ) {
    return this.adminDeviceService.setDisabled(
      staff,
      deviceId,
      true,
      dto.reason,
    );
  }

  @Post(':deviceId/enable')
  @HttpCode(HttpStatus.OK)
  @StaffRoles(StaffRole.SUPPORT, StaffRole.SUPER_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  enable(
    @CurrentStaff() staff: StaffUser,
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() dto: AdminReasonDto,
  ) {
    return this.adminDeviceService.setDisabled(
      staff,
      deviceId,
      false,
      dto.reason,
    );
  }

  @Post(':deviceId/link')
  @HttpCode(HttpStatus.OK)
  @StaffRoles(StaffRole.SUPPORT, StaffRole.SUPER_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  link(
    @CurrentStaff() staff: StaffUser,
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() dto: AdminLinkDeviceDto,
  ) {
    return this.adminDeviceService.link(staff, deviceId, dto);
  }
}
