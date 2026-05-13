import {
  TraccarHttpClient,
  TraccarCredentials,
} from '../../../infrastructure/traccar/traccar-http.client';
import { TraccarGeofence } from '../../domain/entities/traccar-geofence.entity';

interface TraccarGeofenceRaw {
  id: number;
  name: string;
  description: string | null;
  area: string;
  calendarId: number | null;
  attributes: Record<string, unknown>;
}

export class TraccarGeofenceService {
  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async findAll(
    filters?: {
      all?: boolean;
      userId?: number;
      deviceId?: number;
      groupId?: number;
    },
    credentials?: TraccarCredentials,
  ): Promise<TraccarGeofence[]> {
    const raws = await this.traccarClient.get<TraccarGeofenceRaw[]>(
      '/api/geofences',
      filters,
      credentials,
    );
    return raws.map((raw) => this.toDomain(raw));
  }

  async create(
    data: {
      name: string;
      area: string;
      description?: string;
      calendarId?: number;
      attributes?: Record<string, unknown>;
    },
    credentials?: TraccarCredentials,
  ): Promise<TraccarGeofence> {
    const raw = await this.traccarClient.post<TraccarGeofenceRaw>(
      '/api/geofences',
      data,
      credentials,
    );
    return this.toDomain(raw);
  }

  async update(
    id: number,
    data: Partial<TraccarGeofenceRaw>,
    credentials?: TraccarCredentials,
  ): Promise<TraccarGeofence> {
    const raw = await this.traccarClient.put<TraccarGeofenceRaw>(
      `/api/geofences/${id}`,
      { id, ...data },
      credentials,
    );
    return this.toDomain(raw);
  }

  async delete(id: number, credentials?: TraccarCredentials): Promise<void> {
    await this.traccarClient.delete(`/api/geofences/${id}`, credentials);
  }

  private toDomain(raw: TraccarGeofenceRaw): TraccarGeofence {
    return new TraccarGeofence(
      raw.id,
      raw.name,
      raw.description ?? null,
      raw.area,
      raw.calendarId ?? null,
      raw.attributes ?? {},
    );
  }
}
