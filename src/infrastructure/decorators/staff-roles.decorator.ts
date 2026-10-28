import { SetMetadata } from '@nestjs/common';
import { StaffRole } from '../../core/domain/entities/staff-role';

export const STAFF_ROLES_KEY = 'staffRoles';

// Sans décorateur, StaffAuthGuard accepte tout rôle staff valide.
export const StaffRoles = (...roles: StaffRole[]) =>
  SetMetadata(STAFF_ROLES_KEY, roles);
