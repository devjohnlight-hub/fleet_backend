import { TraccarHttpClient } from '../../../infrastructure/traccar/traccar-http.client';
import { TraccarPosition } from '../../domain/entities/traccar-position.entity';

interface TraccarPositionRaw {
  id: number;
  deviceId: number;
  protocol: string | null;
  serverTime: string;
  deviceTime: string;
  fixTime: string;
  outdated: boolean;
  valid: boolean;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  address: string | null;
  accuracy: number;
  attributes: Record<string, unknown>;
}

export class TraccarPositionService {
  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async findAll(filters?: {
    deviceId?: number;
    id?: number;
    from?: string;
    to?: string;
  }): Promise<TraccarPosition[]> {
    const raws = await this.traccarClient.get<TraccarPositionRaw[]>(
      '/api/positions',
      filters,
    );
    return raws.map((raw) => this.toDomain(raw));
  }

  private toDomain(raw: TraccarPositionRaw): TraccarPosition {
    return new TraccarPosition(
      raw.id,
      raw.deviceId,
      raw.protocol ?? null,
      raw.serverTime,
      raw.deviceTime,
      raw.fixTime,
      raw.outdated ?? false,
      raw.valid ?? false,
      raw.latitude,
      raw.longitude,
      raw.altitude ?? 0,
      raw.speed ?? 0,
      raw.course ?? 0,
      raw.address ?? null,
      raw.accuracy ?? 0,
      raw.attributes ?? {},
    );
  }
}
