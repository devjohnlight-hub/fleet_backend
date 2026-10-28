import { Body, Controller, Param, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminClientService } from '../../core/application/services/admin-client.service';
import { AdminClientAccessDto } from '../../core/application/dtos/admin-mutations.dto';
import { StaffRole, StaffUser } from '../../core/domain/entities/staff-role';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { StaffRoles } from '../decorators/staff-roles.decorator';
import { CurrentStaff } from '../decorators/current-staff.decorator';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

@UseGuards(StaffAuthGuard)
@Controller('admin/v1/clients')
export class AdminClientController {
  constructor(private readonly adminClientService: AdminClientService) {}

  @Patch(':uid/access')
  @StaffRoles(StaffRole.SUPPORT, StaffRole.SUPER_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  setAccess(
    @CurrentStaff() staff: StaffUser,
    @Param('uid') uid: string,
    @Body() dto: AdminClientAccessDto,
  ) {
    return this.adminClientService.setAccess(staff, uid, dto);
  }
}
