import {
  BadRequestException,
  ForbiddenException,
  Type,
  ValidationPipe,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Request } from 'express';
import { FirestoreUserController } from './firestore-user.controller';
import { CompanyController } from './company.controller';
import { VehiculeController } from './vehicule.controller';
import { TraccarGroupController } from './traccar-group.controller';
import { FirestoreUserService } from '../../core/application/services/firestore-user.service';
import { UpdateFirestoreUserDto } from '../../core/application/dtos/update-firestore-user.dto';
import {
  FirestoreUser,
  UserType,
} from '../../core/domain/entities/firestore-user.entity';
import { StaffRole } from '../../core/domain/entities/staff-role';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { STAFF_ROLES_KEY } from '../decorators/staff-roles.decorator';

const SECRETS = ['SECRET-TRACCAR-PWD', 'SECRET-FCM-TOKEN'];
const user = (id: string) =>
  new FirestoreUser(
    id,
    `${id}@example.com`,
    'Nom',
    'owner',
    UserType.OWNER,
    null,
    null,
    SECRETS[1],
    7,
    SECRETS[0],
  );
const asUser = (id: string) => ({ user: { id } }) as unknown as Request;

describe('FirestoreUserController — accès et secrets', () => {
  const service = {
    findById: jest.fn(async (id: string) => user(id)),
    findAll: jest.fn(async () => [user('a'), user('b')]),
    update: jest.fn(async (id: string) => user(id)),
    delete: jest.fn(),
    register: jest.fn(async () => user('new')),
  };
  const controller = new FirestoreUserController(
    service as unknown as FirestoreUserService,
  );

  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['GET /users/:id', () => controller.findById(asUser('me'), 'other')],
    ['PUT /users/:id', () => controller.update(asUser('me'), 'other', {})],
    ['DELETE /users/:id', () => controller.delete(asUser('me'), 'other')],
  ])(
    '%s sur un autre compte → 403 sans appel au service',
    async (_label, call) => {
      await expect(call()).rejects.toThrow(ForbiddenException);
      expect(service.findById).not.toHaveBeenCalled();
      expect(service.update).not.toHaveBeenCalled();
      expect(service.delete).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['GET /users/me', () => controller.getMe(asUser('me'))],
    ['GET /users/:id', () => controller.findById(asUser('me'), 'me')],
    [
      'PUT /users/:id',
      () => controller.update(asUser('me'), 'me', { name: 'X' }),
    ],
    ['GET /users', () => controller.findAll()],
    ['POST /users/register', () => controller.register({} as never)],
  ])('%s ne renvoie ni traccarPassword ni fcmToken', async (_label, call) => {
    const raw = JSON.stringify(await call());
    for (const secret of SECRETS) expect(raw).not.toContain(secret);
    expect(raw).not.toMatch(/traccarPassword|fcmToken/);
  });

  it('GET /users est réservé au super_admin', () => {
    const handler = FirestoreUserController.prototype.findAll;
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(
      StaffAuthGuard,
    );
    expect(Reflect.getMetadata(STAFF_ROLES_KEY, handler)).toEqual([
      StaffRole.SUPER_ADMIN,
    ]);
  });

  it.each(['traccarUserId', 'role', 'userType'])(
    'PUT /users/:id refuse le champ %s (400)',
    async (field) => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
      await expect(
        pipe.transform(
          { [field]: field === 'traccarUserId' ? 99 : 'admin' },
          { type: 'body', metatype: UpdateFirestoreUserDto },
        ),
      ).rejects.toThrow(BadRequestException);
    },
  );
});

describe('Controllers hors mobile réservés au super_admin', () => {
  it.each(
    [CompanyController, VehiculeController, TraccarGroupController].map((c) => [
      c.name,
      c,
    ]),
  )('%s', (_name, controller: Type) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toContain(
      StaffAuthGuard,
    );
    expect(Reflect.getMetadata(STAFF_ROLES_KEY, controller)).toEqual([
      StaffRole.SUPER_ADMIN,
    ]);
  });
});
