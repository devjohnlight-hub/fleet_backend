import { RequestMethod, Type } from '@nestjs/common';
import {
  GUARDS_METADATA,
  INTERCEPTORS_METADATA,
  METHOD_METADATA,
  MODULE_METADATA,
} from '@nestjs/common/constants';
import { AdminModule } from './admin.module';
import { AdminStaffController } from '../controllers/admin-staff.controller';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';
import { STAFF_ROLES_KEY } from '../decorators/staff-roles.decorator';
import { StaffRole } from '../../core/domain/entities/staff-role';

// Inspecte les métadonnées de toutes les routes : une nouvelle route mal protégée fait échouer ce test
const controllers = Reflect.getMetadata(
  MODULE_METADATA.CONTROLLERS,
  AdminModule,
) as Type[];

const routes = controllers.flatMap((controller) =>
  Object.getOwnPropertyNames(controller.prototype)
    .filter((name) => name !== 'constructor')
    .map((name) => {
      const handler = controller.prototype[name] as object;
      return {
        label: `${controller.name}.${name}`,
        controller,
        method: Reflect.getMetadata(METHOD_METADATA, handler) as
          | RequestMethod
          | undefined,
        roles: (Reflect.getMetadata(STAFF_ROLES_KEY, handler) ??
          Reflect.getMetadata(STAFF_ROLES_KEY, controller)) as
          | StaffRole[]
          | undefined,
        interceptors: (Reflect.getMetadata(INTERCEPTORS_METADATA, handler) ??
          []) as unknown[],
      };
    })
    .filter((route) => route.method !== undefined),
);
const mutations = routes.filter((r) => r.method !== RequestMethod.GET);

describe('AdminModule — RBAC des routes', () => {
  it('trouve les routes de mutation attendues', () => {
    expect(mutations.length).toBeGreaterThanOrEqual(9);
  });

  it.each(controllers.map((c) => [c.name, c]))(
    '%s est protégé par StaffAuthGuard',
    (_name, controller) => {
      const guards = (Reflect.getMetadata(GUARDS_METADATA, controller) ??
        []) as unknown[];
      expect(guards).toContain(StaffAuthGuard);
    },
  );

  it.each(mutations.map((r) => [r.label, r]))(
    '%s restreint les rôles et exclut viewer',
    (_label, route) => {
      expect(route.roles).toBeDefined();
      expect(route.roles!.length).toBeGreaterThan(0);
      expect(route.roles).not.toContain(StaffRole.VIEWER);
    },
  );

  it.each(mutations.map((r) => [r.label, r]))(
    '%s accepte Idempotency-Key',
    (_label, route) => {
      expect(route.interceptors).toContain(IdempotencyInterceptor);
    },
  );

  it('réserve la gestion du staff au super_admin', () => {
    const staffRoutes = routes.filter(
      (r) => r.controller === AdminStaffController,
    );
    expect(staffRoutes.length).toBeGreaterThan(0);
    for (const route of staffRoutes)
      expect(route.roles).toEqual([StaffRole.SUPER_ADMIN]);
  });
});
