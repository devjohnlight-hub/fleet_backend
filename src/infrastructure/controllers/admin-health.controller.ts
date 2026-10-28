import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminHealthService } from '../../core/application/services/admin-health.service';
import { StaffAuthGuard } from '../guards/staff-auth.guard';

@UseGuards(StaffAuthGuard)
@Controller('admin/v1/health')
export class AdminHealthController {
  constructor(private readonly adminHealthService: AdminHealthService) {}

  @Get()
  check() {
    return this.adminHealthService.check();
  }
}
