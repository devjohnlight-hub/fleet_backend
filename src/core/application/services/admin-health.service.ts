import { FirestoreService } from '../../../infrastructure/firebase/firestore.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { TraccarHttpClient } from '../../../infrastructure/traccar/traccar-http.client';

export interface DependencyCheck {
  status: 'up' | 'down';
  latencyMs: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'degraded';
  checkedAt: string;
  checks: Record<'firestore' | 'redis' | 'traccar', DependencyCheck>;
}

export class AdminHealthService {
  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly redisService: RedisService,
    private readonly traccarClient: TraccarHttpClient,
  ) {}

  async check(): Promise<HealthReport> {
    const [firestore, redis, traccar] = await Promise.all([
      this.measure(() =>
        this.firestoreService.collection('admin_audit_logs').limit(1).get(),
      ),
      this.measure(() => this.redisService.getClient().ping()),
      this.measure(() => this.traccarClient.get('/api/server')),
    ]);

    const checks = { firestore, redis, traccar };
    const allUp = Object.values(checks).every((c) => c.status === 'up');

    return {
      status: allUp ? 'ok' : 'degraded',
      checkedAt: new Date().toISOString(),
      checks,
    };
  }

  private async measure(
    probe: () => Promise<unknown>,
  ): Promise<DependencyCheck> {
    const start = Date.now();
    try {
      await probe();
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (err) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      };
    }
  }
}
