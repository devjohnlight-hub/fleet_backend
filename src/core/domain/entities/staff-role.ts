export enum StaffRole {
  SUPER_ADMIN = 'super_admin',
  SUPPORT = 'support',
  BILLING = 'billing',
  VIEWER = 'viewer',
}

export const STAFF_ROLE_CLAIM = 'staffRole';

export interface StaffUser {
  id: string;
  email: string | null;
  role: StaffRole;
  requestId: string;
}

export function isStaffRole(value: unknown): value is StaffRole {
  return Object.values(StaffRole).includes(value as StaffRole);
}
