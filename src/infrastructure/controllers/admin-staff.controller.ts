import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminStaffService } from '../../core/application/services/admin-staff.service';
import {
  AdminGrantStaffDto,
  AdminUpdateStaffRoleDto,
} from '../../core/application/dtos/admin-mutations.dto';
import { StaffRole, StaffUser } from '../../core/domain/entities/staff-role';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { StaffRoles } from '../decorators/staff-roles.decorator';
import { CurrentStaff } from '../decorators/current-staff.decorator';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

@UseGuards(StaffAuthGuard)
@StaffRoles(StaffRole.SUPER_ADMIN)
@Controller('admin/v1/staff')
export class AdminStaffController {
  constructor(private readonly adminStaffService: AdminStaffService) {}

  @Get()
  list() {
    return this.adminStaffService.list();
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  grant(@CurrentStaff() staff: StaffUser, @Body() dto: AdminGrantStaffDto) {
    return this.adminStaffService.grant(staff, dto);
  }

  @Patch(':uid')
  @UseInterceptors(IdempotencyInterceptor)
  updateRole(
    @CurrentStaff() staff: StaffUser,
    @Param('uid') uid: string,
    @Body() dto: AdminUpdateStaffRoleDto,
  ) {
    return this.adminStaffService.updateRole(staff, uid, dto);
  }
}
