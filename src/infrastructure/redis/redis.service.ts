import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.get<string>('REDIS_PASSWORD'),
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 500, 10_000),
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.connect().catch((err: Error) => {
      this.logger.error(`Redis initial connection failed: ${err.message}`);
    });
  }

  // Cache
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return typeof value === 'string' ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Compteur
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async getCount(key: string): Promise<number> {
    const val = await this.client.get(key);
    return val ? parseInt(val, 10) : 0;
  }

  getClient(): Redis {
    return this.client;
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }
}
