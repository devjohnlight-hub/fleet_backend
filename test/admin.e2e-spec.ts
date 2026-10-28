import {
  Global,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import * as admin from 'firebase-admin';
import { AdminModule } from '../src/infrastructure/modules/admin.module';
import { FirestoreService } from '../src/infrastructure/firebase/firestore.service';
import { RedisService } from '../src/infrastructure/redis/redis.service';
import { TraccarHttpClient } from '../src/infrastructure/traccar/traccar-http.client';
import { ResponseInterceptor } from '../src/infrastructure/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/infrastructure/filters/http-exception.filter';
import { FakeFirestore, FakeRedis } from './support/fake-firestore';

// --- Firebase Auth simulé : un token par rôle ---
const tokens: Record<string, Record<string, unknown>> = {
  viewer: { uid: 'staff-viewer', email: 'viewer@zira.ci', staffRole: 'viewer' },
  support: {
    uid: 'staff-support',
    email: 'support@zira.ci',
    staffRole: 'support',
  },
  billing: {
    uid: 'staff-billing',
    email: 'billing@zira.ci',
    staffRole: 'billing',
  },
  super: {
    uid: 'staff-super',
    email: 'super@zira.ci',
    staffRole: 'super_admin',
  },
  client: { uid: 'owner-1', email: 'owner@example.com' },
};
const authMock = {
  verifyIdToken: jest.fn(async (token: string) => {
    if (!tokens[token]) throw new Error('auth/argument-error');
    return tokens[token];
  }),
  getUser: jest.fn(async (uid: string) => ({
    uid,
    disabled: false,
    customClaims: {},
  })),
  getUserByEmail: jest.fn(),
  updateUser: jest.fn(),
  revokeRefreshTokens: jest.fn(),
  setCustomUserClaims: jest.fn(),
  listUsers: jest.fn(async () => ({ users: [] })),
};
Object.defineProperty(admin, 'auth', {
  value: () => authMock,
  configurable: true,
});

// --- Traccar simulé ---
const device = {
  id: 42,
  name: 'Tracker',
  uniqueId: 'IMEI42',
  status: 'online',
  disabled: false,
  lastUpdate: new Date().toISOString(),
  positionId: null,
  groupId: 0,
  phone: null,
  model: 'GT06',
  contact: null,
  category: 'car',
  attributes: {},
};
const traccar = {
  get: jest.fn(async (path: string, params?: Record<string, unknown>) => {
    if (path === '/api/devices')
      return params?.id && params.id !== 42 ? [] : [device];
    return [];
  }),
  put: jest.fn(async (_path: string, body: Record<string, unknown>) => ({
    ...device,
    ...body,
  })),
  linkDeviceToUser: jest.fn(),
};

const SECRETS = ['SECRET-TRACCAR-PWD', 'SECRET-FCM-TOKEN'];
const firestore = new FakeFirestore();
const redis = new FakeRedis();

@Global()
@Module({
  providers: [
    { provide: FirestoreService, useValue: firestore },
    { provide: RedisService, useValue: redis },
    {
      provide: ConfigService,
      useValue: { get: () => undefined, getOrThrow: () => 'test' },
    },
  ],
  exports: [FirestoreService, RedisService, ConfigService],
})
class FakeInfraModule {}

describe('Admin API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      imports: [FakeInfraModule, AdminModule],
    })
      .overrideProvider(TraccarHttpClient)
      .useValue(traccar)
      .compile();

    // Même configuration globale que main.ts
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    firestore.seed('users', {
      'owner-1': {
        email: 'owner@example.com',
        name: 'Owner',
        traccarUserId: 7,
        traccarPassword: SECRETS[0],
        fcmToken: SECRETS[1],
      },
    });
    firestore.seed('vehicles', {
      'veh-1': {
        label: 'Corolla',
        plate: 'AB-123',
        ownerId: 'owner-1',
        deviceId: 42,
        uniqueId: 'IMEI42',
      },
    });
    firestore.seed('admin_audit_logs', {});
  });

  const http = () => request(app.getHttpServer());
  const reason = 'Motif de test e2e';
  const mutations: [string, string, Record<string, unknown>][] = [
    ['patch', '/admin/v1/devices/42', { name: 'Nouveau nom', reason }],
    ['post', '/admin/v1/devices/42/disable', { reason }],
    ['post', '/admin/v1/devices/42/enable', { reason }],
    [
      'post',
      '/admin/v1/devices/42/link',
      { vehicleId: 'veh-1', ownerId: 'owner-1', reason },
    ],
    ['patch', '/admin/v1/clients/owner-1/access', { disabled: true, reason }],
    ['post', '/admin/v1/clients/owner-1/notes', { body: 'Note' }],
    [
      'post',
      '/admin/v1/subscriptions/owner-1/adjustments',
      { status: 'active', reason },
    ],
    [
      'post',
      '/admin/v1/staff',
      { email: 'new@zira.ci', role: 'viewer', reason },
    ],
    ['patch', '/admin/v1/staff/staff-billing', { role: null, reason }],
  ];
  const send = (method: string, path: string, body: object, token?: string) => {
    const req = (
      http() as unknown as Record<string, (p: string) => request.Test>
    )[method](path);
    return (token ? req.set('Authorization', `Bearer ${token}`) : req).send(
      body,
    );
  };

  describe('authentification', () => {
    it.each(mutations)('%s %s sans token → 401', async (method, path, body) => {
      await send(method, path, body).expect(401);
    });

    it('un compte client (sans claim staff) → 403', async () => {
      await send('get', '/admin/v1/devices', {}, 'client').expect(403);
    });
  });

  describe('viewer ne peut effectuer aucune mutation', () => {
    it.each(mutations)('%s %s → 403', async (method, path, body) => {
      const res = await send(method, path, body, 'viewer').expect(403);
      expect(res.body.message).toBe('Rôle insuffisant pour cette action');
    });

    it("aucun effet de bord ni écriture d'audit", async () => {
      for (const [method, path, body] of mutations)
        await send(method, path, body, 'viewer');
      expect(traccar.put).not.toHaveBeenCalled();
      expect(traccar.linkDeviceToUser).not.toHaveBeenCalled();
      expect(authMock.updateUser).not.toHaveBeenCalled();
      expect(authMock.setCustomUserClaims).not.toHaveBeenCalled();
      expect(firestore.all('admin_audit_logs')).toHaveLength(0);
    });

    it("viewer n'a pas accès aux logs d'audit", async () => {
      await send('get', '/admin/v1/audit-logs', {}, 'viewer').expect(403);
    });
  });

  describe('séparation des rôles', () => {
    it.each(
      mutations.filter(
        ([, p]) => p.includes('/subscriptions/') || p.includes('/staff'),
      ),
    )('support : %s %s → 403', async (method, path, body) => {
      await send(method, path, body, 'support').expect(403);
    });

    it.each(
      mutations.filter(
        ([, p]) =>
          p.includes('/devices/') ||
          p.includes('/clients/') ||
          p.includes('/staff'),
      ),
    )('billing : %s %s → 403', async (method, path, body) => {
      await send(method, path, body, 'billing').expect(403);
    });
  });

  describe('aucun champ secret dans les réponses', () => {
    it.each(['/admin/v1/devices', '/admin/v1/devices/42'])(
      'GET %s',
      async (path) => {
        const res = await send('get', path, {}, 'viewer').expect(200);
        const raw = JSON.stringify(res.body);
        expect(res.body.data).toBeTruthy();
        for (const secret of SECRETS) expect(raw).not.toContain(secret);
        expect(raw).not.toMatch(/traccarPassword|fcmToken/);
      },
    );

    it('le device est bien enrichi avec le client et le véhicule', async () => {
      const res = await send('get', '/admin/v1/devices', {}, 'viewer').expect(
        200,
      );
      expect(res.body.data.items[0]).toMatchObject({
        id: 42,
        vehicle: { id: 'veh-1', plate: 'AB-123' },
        client: { id: 'owner-1', email: 'owner@example.com' },
        issues: [],
      });
    });
  });

  describe('mutation autorisée', () => {
    it('support désactive un device : Traccar mis à jour et audit écrit', async () => {
      const res = await send(
        'post',
        '/admin/v1/devices/42/disable',
        { reason },
        'support',
      ).expect(200);
      expect(res.body.data).toMatchObject({
        deviceId: 42,
        changed: true,
        device: { disabled: true },
      });
      expect(traccar.put).toHaveBeenCalledWith(
        '/api/devices/42',
        expect.objectContaining({
          id: 42,
          disabled: true,
          name: 'Tracker',
          uniqueId: 'IMEI42',
        }),
        undefined,
      );
      expect(firestore.all('admin_audit_logs')).toEqual([
        expect.objectContaining({
          actorUid: 'staff-support',
          actorRole: 'support',
          action: 'device.disable',
          targetId: '42',
          result: 'success',
          reason,
          before: { disabled: false },
          after: { disabled: true },
        }),
      ]);
    });

    it('rejette une mutation sans motif (400)', async () => {
      await send('post', '/admin/v1/devices/42/disable', {}, 'support').expect(
        400,
      );
      expect(traccar.put).not.toHaveBeenCalled();
    });

    it("Idempotency-Key : une relance rejoue la réponse sans refaire l'action", async () => {
      const key = 'idem-key-12345';
      const first = await send(
        'post',
        '/admin/v1/devices/42/disable',
        { reason },
        'support',
      )
        .set('Idempotency-Key', key)
        .expect(200);
      const second = await send(
        'post',
        '/admin/v1/devices/42/disable',
        { reason },
        'support',
      )
        .set('Idempotency-Key', key)
        .expect(200);

      expect(second.body).toEqual(first.body);
      expect(traccar.put).toHaveBeenCalledTimes(1);

      await send(
        'post',
        '/admin/v1/devices/42/disable',
        { reason: 'Un autre motif' },
        'support',
      )
        .set('Idempotency-Key', key)
        .expect(422);
    });
  });
});
