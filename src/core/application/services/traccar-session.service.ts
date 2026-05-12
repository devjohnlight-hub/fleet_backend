import { TraccarHttpClient } from '../../../infrastructure/traccar/traccar-http.client';
import { TraccarUser } from '../../domain/entities/traccar-user.entity';

interface TraccarUserRaw {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  readonly: boolean;
  administrator: boolean;
  map: string | null;
  latitude: number;
  longitude: number;
  zoom: number;
  coordinateFormat: string | null;
  disabled: boolean;
  expirationTime: string | null;
  deviceLimit: number;
  userLimit: number;
  deviceReadonly: boolean;
  limitCommands: boolean;
  fixedEmail: boolean;
  poiLayer: string | null;
  attributes: Record<string, unknown>;
}

export class TraccarSessionService {
  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async getSession(token?: string): Promise<TraccarUser> {
    const raw = await this.traccarClient.get<TraccarUserRaw>(
      '/api/session',
      token ? { token } : undefined,
    );
    return this.toDomain(raw);
  }

  async createSession(email: string, password: string): Promise<TraccarUser> {
    const raw = await this.traccarClient.postForm<TraccarUserRaw>(
      '/api/session',
      { email, password },
    );
    return this.toDomain(raw);
  }

  async deleteSession(): Promise<void> {
    await this.traccarClient.delete('/api/session');
  }

  private toDomain(raw: TraccarUserRaw): TraccarUser {
    return new TraccarUser(
      raw.id,
      raw.name,
      raw.email,
      raw.phone ?? null,
      raw.readonly ?? false,
      raw.administrator ?? false,
      raw.map ?? null,
      raw.latitude ?? 0,
      raw.longitude ?? 0,
      raw.zoom ?? 0,
      raw.coordinateFormat ?? null,
      raw.disabled ?? false,
      raw.expirationTime ?? null,
      raw.deviceLimit ?? -1,
      raw.userLimit ?? 0,
      raw.deviceReadonly ?? false,
      raw.limitCommands ?? false,
      raw.fixedEmail ?? false,
      raw.poiLayer ?? null,
      raw.attributes ?? {},
    );
  }
}
