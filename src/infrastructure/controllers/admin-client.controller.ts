import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminClientService } from '../../core/application/services/admin-client.service';
import { AdminClientNoteService } from '../../core/application/services/admin-client-note.service';
import {
  AdminClientAccessDto,
  AdminCreateClientNoteDto,
} from '../../core/application/dtos/admin-mutations.dto';
import { AdminCursorQueryDto } from '../../core/application/dtos/admin-queries.dto';
import { StaffRole, StaffUser } from '../../core/domain/entities/staff-role';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { StaffRoles } from '../decorators/staff-roles.decorator';
import { CurrentStaff } from '../decorators/current-staff.decorator';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

@UseGuards(StaffAuthGuard)
@Controller('admin/v1/clients')
export class AdminClientController {
  constructor(
    private readonly adminClientService: AdminClientService,
    private readonly adminClientNoteService: AdminClientNoteService,
  ) {}

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

  @Get(':uid/notes')
  @StaffRoles(StaffRole.SUPPORT, StaffRole.BILLING, StaffRole.SUPER_ADMIN)
  listNotes(@Param('uid') uid: string, @Query() query: AdminCursorQueryDto) {
    return this.adminClientNoteService.list(uid, query);
  }

  @Post(':uid/notes')
  @StaffRoles(StaffRole.SUPPORT, StaffRole.SUPER_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  createNote(
    @CurrentStaff() staff: StaffUser,
    @Param('uid') uid: string,
    @Body() dto: AdminCreateClientNoteDto,
  ) {
    return this.adminClientNoteService.create(staff, uid, dto);
  }
}
