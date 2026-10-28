import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as admin from 'firebase-admin';
import { StaffAuthGuard } from './staff-auth.guard';
import { STAFF_ROLES_KEY } from '../decorators/staff-roles.decorator';
import { StaffRole } from '../../core/domain/entities/staff-role';

const verifyIdToken = jest.fn();
Object.defineProperty(admin, 'auth', {
  value: () => ({ verifyIdToken }),
  configurable: true,
});

function buildContext(headers: Record<string, string>, allowed?: StaffRole[]) {
  const request = { headers } as unknown as Request;
  const response = { setHeader: jest.fn() };
  const handler = () => undefined;
  class TestController {}
  if (allowed) Reflect.defineMetadata(STAFF_ROLES_KEY, allowed, handler);

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    getHandler: () => handler,
    getClass: () => TestController,
  } as unknown as ExecutionContext;
  return { context, request, response };
}

describe('StaffAuthGuard', () => {
  const guard = new StaffAuthGuard(new Reflector());

  beforeEach(() => verifyIdToken.mockReset());

  it('refuse une requête sans token (401)', async () => {
    const { context } = buildContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it("refuse un header Authorization qui n'est pas Bearer (401)", async () => {
    const { context } = buildContext({ authorization: 'Basic abc' });
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refuse un token invalide ou révoqué (401)', async () => {
    verifyIdToken.mockRejectedValue(new Error('auth/id-token-revoked'));
    const { context } = buildContext({ authorization: 'Bearer tok' });
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('vérifie la révocation du token', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', staffRole: 'viewer' });
    const { context } = buildContext({ authorization: 'Bearer tok' });
    await guard.canActivate(context);
    expect(verifyIdToken).toHaveBeenCalledWith('tok', true);
  });

  it('refuse un compte client sans claim staff (403)', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'client' });
    const { context } = buildContext({ authorization: 'Bearer tok' });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('Accès réservé au personnel Zira'),
    );
  });

  it('refuse un claim staff inconnu (403)', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', staffRole: 'admin' });
    const { context } = buildContext({ authorization: 'Bearer tok' });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('refuse un rôle insuffisant pour la route (403)', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', staffRole: StaffRole.VIEWER });
    const { context } = buildContext({ authorization: 'Bearer tok' }, [
      StaffRole.SUPPORT,
      StaffRole.SUPER_ADMIN,
    ]);
    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('Rôle insuffisant pour cette action'),
    );
  });

  it('accepte un rôle autorisé et pose req.staff', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'u1',
      email: 'ops@zira.ci',
      staffRole: StaffRole.SUPPORT,
    });
    const { context, request, response } = buildContext(
      { authorization: 'Bearer tok' },
      [StaffRole.SUPPORT],
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request['staff']).toEqual({
      id: 'u1',
      email: 'ops@zira.ci',
      role: StaffRole.SUPPORT,
      requestId: expect.any(String),
    });
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      request['staff'].requestId,
    );
  });

  it('accepte tout rôle staff sans décorateur @StaffRoles', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', staffRole: StaffRole.VIEWER });
    const { context } = buildContext({ authorization: 'Bearer tok' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('réutilise un X-Request-Id valide et remplace un invalide', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', staffRole: StaffRole.VIEWER });

    const valid = buildContext({
      authorization: 'Bearer tok',
      'x-request-id': 'req-12345678',
    });
    await guard.canActivate(valid.context);
    expect(valid.request['staff'].requestId).toBe('req-12345678');

    const invalid = buildContext({
      authorization: 'Bearer tok',
      'x-request-id': 'bad id!',
    });
    await guard.canActivate(invalid.context);
    expect(invalid.request['staff'].requestId).not.toBe('bad id!');
  });
});
