import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token Firebase manquant');
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      request['user'] = {
        id: decoded.uid,
        email: decoded.email ?? null,
        name: decoded.name ?? null,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token Firebase invalide ou expiré');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}
