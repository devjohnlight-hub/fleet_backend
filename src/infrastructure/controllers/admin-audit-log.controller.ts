import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuditService } from '../../core/application/services/admin-audit.service';
import { AdminAuditLogsQueryDto } from '../../core/application/dtos/admin-queries.dto';
import { StaffRole } from '../../core/domain/entities/staff-role';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { StaffRoles } from '../decorators/staff-roles.decorator';

// Pas de viewer : les logs contiennent l'état avant/après des données clients
@UseGuards(StaffAuthGuard)
@StaffRoles(StaffRole.SUPER_ADMIN, StaffRole.SUPPORT, StaffRole.BILLING)
@Controller('admin/v1/audit-logs')
export class AdminAuditLogController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @Get()
  list(@Query() query: AdminAuditLogsQueryDto) {
    return this.adminAuditService.list(query);
  }
}
