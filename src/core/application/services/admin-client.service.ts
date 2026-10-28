import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { AdminAuditService } from './admin-audit.service';
import { AdminClientAccessDto } from '../dtos/admin-mutations.dto';
import {
  STAFF_ROLE_CLAIM,
  StaffRole,
  StaffUser,
  isStaffRole,
} from '../../domain/entities/staff-role';

export interface ClientAccessResult {
  uid: string;
  disabled: boolean;
  changed: boolean;
}

export class AdminClientService {
  constructor(private readonly auditService: AdminAuditService) {}

  async setAccess(
    staff: StaffUser,
    uid: string,
    dto: AdminClientAccessDto,
  ): Promise<ClientAccessResult> {
    if (uid === staff.id) {
      throw new BadRequestException('Impossible de modifier son propre accès');
    }

    // auth/user-not-found → 404 via HttpExceptionFilter
    const user = await admin.auth().getUser(uid);
    if (isStaffRole(user.customClaims?.[STAFF_ROLE_CLAIM]) && staff.role !== StaffRole.SUPER_ADMIN) {
      throw new ForbiddenException('Seul un super_admin peut modifier l\'accès d\'un compte staff');
    }

    if (user.disabled === dto.disabled) {
      return { uid, disabled: user.disabled, changed: false };
    }

    return this.auditService.record(
      staff,
      {
        action: dto.disabled ? 'client.suspend' : 'client.reactivate',
        targetType: 'client',
        targetId: uid,
        reason: dto.reason,
        before: { disabled: user.disabled },
      },
      async () => {
        await admin.auth().updateUser(uid, { disabled: dto.disabled });
        // Une suspension doit couper les sessions en cours, pas seulement les futures
        if (dto.disabled) await admin.auth().revokeRefreshTokens(uid);
        return {
          result: { uid, disabled: dto.disabled, changed: true },
          after: { disabled: dto.disabled, sessionsRevoked: dto.disabled },
        };
      },
    );
  }
}
