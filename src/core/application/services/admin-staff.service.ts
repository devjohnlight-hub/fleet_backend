import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { AdminAuditService } from './admin-audit.service';
import {
  AdminGrantStaffDto,
  AdminUpdateStaffRoleDto,
} from '../dtos/admin-mutations.dto';
import {
  STAFF_ROLE_CLAIM,
  StaffRole,
  StaffUser,
  isStaffRole,
} from '../../domain/entities/staff-role';

export interface StaffMember {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: StaffRole | null;
  disabled: boolean;
  mfaEnrolled: boolean;
  lastSignInTime: string | null;
}

export interface StaffRoleChange {
  member: StaffMember;
  changed: boolean;
}

export class AdminStaffService {
  constructor(private readonly auditService: AdminAuditService) {}

  // Auth n'indexe pas les claims : on parcourt tous les comptes (volume staff faible)
  async list(): Promise<StaffMember[]> {
    const members: StaffMember[] = [];
    let pageToken: string | undefined;
    do {
      const page = await admin.auth().listUsers(1000, pageToken);
      for (const user of page.users) {
        if (isStaffRole(user.customClaims?.[STAFF_ROLE_CLAIM])) members.push(this.toMember(user));
      }
      pageToken = page.pageToken;
    } while (pageToken);
    return members;
  }

  // Le compte doit déjà exister : pas de création de compte depuis l'API
  async grant(actor: StaffUser, dto: AdminGrantStaffDto): Promise<StaffMember> {
    const user = await admin.auth().getUserByEmail(dto.email);
    if (user.uid === actor.id) {
      throw new BadRequestException('Impossible de modifier son propre rôle');
    }
    const current = this.roleOf(user);
    if (current) {
      throw new ConflictException(`Ce compte est déjà staff (${current}) : utiliser PATCH /admin/v1/staff/:uid`);
    }

    return this.auditService.record(
      actor,
      { action: 'staff.grant', targetType: 'staff', targetId: user.uid, reason: dto.reason, before: { role: null } },
      async () => {
        const member = await this.applyRole(user, dto.role);
        return { result: member, after: { role: dto.role } };
      },
    );
  }

  async updateRole(
    actor: StaffUser,
    uid: string,
    dto: AdminUpdateStaffRoleDto,
  ): Promise<StaffRoleChange> {
    // Empêche aussi de retirer le dernier super_admin : l'appelant en est un
    if (uid === actor.id) {
      throw new BadRequestException('Impossible de modifier son propre rôle');
    }
    const user = await admin.auth().getUser(uid);
    const current = this.roleOf(user);
    if (!current) throw new NotFoundException('Ce compte n\'est pas staff : utiliser POST /admin/v1/staff');
    if (current === dto.role) return { member: this.toMember(user), changed: false };

    return this.auditService.record(
      actor,
      {
        action: dto.role === null ? 'staff.revoke' : 'staff.update',
        targetType: 'staff',
        targetId: uid,
        reason: dto.reason,
        before: { role: current },
      },
      async () => {
        const member = await this.applyRole(user, dto.role);
        return { result: { member, changed: true }, after: { role: dto.role } };
      },
    );
  }

  // Révoque les sessions pour que le nouveau claim s'applique dès la reconnexion
  private async applyRole(user: admin.auth.UserRecord, role: StaffRole | null): Promise<StaffMember> {
    const claims = { ...(user.customClaims ?? {}) };
    if (role === null) delete claims[STAFF_ROLE_CLAIM];
    else claims[STAFF_ROLE_CLAIM] = role;

    await admin.auth().setCustomUserClaims(user.uid, claims);
    await admin.auth().revokeRefreshTokens(user.uid);
    return this.toMember(await admin.auth().getUser(user.uid));
  }

  private roleOf(user: admin.auth.UserRecord): StaffRole | null {
    const role: unknown = user.customClaims?.[STAFF_ROLE_CLAIM];
    return isStaffRole(role) ? role : null;
  }

  private toMember(user: admin.auth.UserRecord): StaffMember {
    return {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      role: this.roleOf(user),
      disabled: user.disabled,
      mfaEnrolled: (user.multiFactor?.enrolledFactors.length ?? 0) > 0,
      lastSignInTime: user.metadata.lastSignInTime ?? null,
    };
  }
}
