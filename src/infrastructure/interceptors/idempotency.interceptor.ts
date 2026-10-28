import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request } from 'express';
import { createHash } from 'crypto';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { RedisService } from '../redis/redis.service';
import { StaffUser } from '../../core/domain/entities/staff-role';

const TTL_SECONDS = 24 * 60 * 60;

interface StoredEntry {
  state: 'pending' | 'done';
  fingerprint: string;
  response?: unknown;
}

// À placer derrière StaffAuthGuard. Sans header Idempotency-Key, la requête passe normalement.
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['idempotency-key'];
    if (key === undefined) return next.handle();
    if (typeof key !== 'string' || !/^[\w-]{8,128}$/.test(key)) {
      throw new BadRequestException(
        'Idempotency-Key invalide (8 à 128 caractères [A-Za-z0-9_-])',
      );
    }

    const staff = request['staff'] as StaffUser;
    const redisKey = `admin:idempotency:${staff.id}:${request.method}:${request.path}:${key}`;
    const fingerprint = createHash('sha256')
      .update(JSON.stringify(request.body ?? {}))
      .digest('hex');

    const pending: StoredEntry = { state: 'pending', fingerprint };
    const acquired = await this.redisService
      .getClient()
      .set(redisKey, JSON.stringify(pending), 'EX', TTL_SECONDS, 'NX');

    if (!acquired) {
      const existing = await this.redisService.get<StoredEntry>(redisKey);
      if (existing && existing.fingerprint !== fingerprint) {
        throw new UnprocessableEntityException(
          'Idempotency-Key déjà utilisée avec un autre corps de requête',
        );
      }
      if (existing?.state === 'done') return of(existing.response);
      throw new ConflictException(
        'Une requête avec cette Idempotency-Key est déjà en cours',
      );
    }

    return next.handle().pipe(
      // Échec : on libère la clé pour permettre une nouvelle tentative
      catchError((err: unknown) =>
        from(this.redisService.del(redisKey)).pipe(
          mergeMap(() => throwError(() => err)),
        ),
      ),
      mergeMap(async (response: unknown) => {
        const done: StoredEntry = { state: 'done', fingerprint, response };
        try {
          await this.redisService.set(redisKey, done, TTL_SECONDS);
        } catch (err) {
          // La mutation a réussi : on ne la fait pas échouer pour un problème de cache
          this.logger.error(
            `Stockage idempotence impossible : ${(err as Error).message}`,
          );
          await this.redisService.del(redisKey).catch(() => undefined);
        }
        return response;
      }),
    );
  }
}
