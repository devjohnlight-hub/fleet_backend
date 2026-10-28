import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import * as admin from 'firebase-admin';
import {
  STAFF_ROLE_CLAIM,
  StaffRole,
  StaffUser,
  isStaffRole,
} from '../../core/domain/entities/staff-role';
import { STAFF_ROLES_KEY } from '../decorators/staff-roles.decorator';

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token Firebase manquant');
    }

    let decoded: admin.auth.DecodedIdToken;
    try {
      // checkRevoked: un compte staff suspendu ou rétrogradé perd l'accès immédiatement
      decoded = await admin.auth().verifyIdToken(token, true);
    } catch {
      throw new UnauthorizedException('Token Firebase invalide ou expiré');
    }

    const role: unknown = decoded[STAFF_ROLE_CLAIM];
    if (!isStaffRole(role)) {
      throw new ForbiddenException('Accès réservé au personnel Zira');
    }

    const allowed = this.reflector.getAllAndOverride<StaffRole[] | undefined>(
      STAFF_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowed && !allowed.includes(role)) {
      throw new ForbiddenException('Rôle insuffisant pour cette action');
    }

    const requestId = this.extractRequestId(request);
    context.switchToHttp().getResponse<Response>().setHeader('X-Request-Id', requestId);

    request['staff'] = {
      id: decoded.uid,
      email: decoded.email ?? null,
      role,
      requestId,
    } satisfies StaffUser;
    return true;
  }

  private extractRequestId(request: Request): string {
    const header = request.headers['x-request-id'];
    if (typeof header === 'string' && /^[\w-]{8,64}$/.test(header)) {
      return header;
    }
    return randomUUID();
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}
