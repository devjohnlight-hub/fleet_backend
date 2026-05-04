import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './infrastructure/interceptors/response.interceptor';
import { HttpExceptionFilter } from './infrastructure/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { RedisService } from './infrastructure/redis/redis.service';
import { ApiCounterInterceptor } from './infrastructure/interceptors/api-counter.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redisService = app.get(RedisService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ApiCounterInterceptor(redisService),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
