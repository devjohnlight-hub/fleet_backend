import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ApiCounterInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) { }


  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      route?: { path: string };
      url: string;
    }>();

    const key = `api:counter:${request.method}:${request.route?.path ?? request.url}`;

    return next.handle().pipe(
      tap(() => {
        void this.redisService.incr(key);
      }),
    );
  }
}
