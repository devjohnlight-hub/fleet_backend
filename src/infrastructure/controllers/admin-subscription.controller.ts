import { Body, Controller, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminSubscriptionService } from '../../core/application/services/admin-subscription.service';
import { AdminSubscriptionAdjustmentDto } from '../../core/application/dtos/admin-mutations.dto';
import { StaffRole, StaffUser } from '../../core/domain/entities/staff-role';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { StaffRoles } from '../decorators/staff-roles.decorator';
import { CurrentStaff } from '../decorators/current-staff.decorator';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

@UseGuards(StaffAuthGuard)
@Controller('admin/v1/subscriptions')
export class AdminSubscriptionController {
  constructor(private readonly adminSubscriptionService: AdminSubscriptionService) {}

  @Post(':uid/adjustments')
  @StaffRoles(StaffRole.BILLING, StaffRole.SUPER_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  adjust(
    @CurrentStaff() staff: StaffUser,
    @Param('uid') uid: string,
    @Body() dto: AdminSubscriptionAdjustmentDto,
  ) {
    return this.adminSubscriptionService.adjust(staff, uid, dto);
  }
}
