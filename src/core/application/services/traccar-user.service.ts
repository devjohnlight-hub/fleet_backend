import { ConflictException } from '@nestjs/common';
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

export class TraccarUserService {
  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async findAll(filters?: {
    userId?: string;
    limit?: number;
    offset?: number;
    keyword?: string;
  }): Promise<TraccarUser[]> {
    const raws = await this.traccarClient.get<TraccarUserRaw[]>(
      '/api/users',
      filters,
    );
    return raws.map((raw) => this.toDomain(raw));
  }

  async create(data: Omit<TraccarUserRaw, 'id'>): Promise<TraccarUser> {
    try {
      const raw = await this.traccarClient.post<TraccarUserRaw>(
        '/api/users',
        data,
      );
      return this.toDomain(raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Duplicate entry')) {
        throw new ConflictException('Cet email existe déjà dans Traccar');
      }
      throw error;
    }
  }

  async update(
    id: number,
    data: Partial<TraccarUserRaw>,
  ): Promise<TraccarUser> {
    const raw = await this.traccarClient.put<TraccarUserRaw>(
      `/api/users/${id}`,
      { id, ...data },
    );
    return this.toDomain(raw);
  }

  async delete(id: number): Promise<void> {
    await this.traccarClient.delete(`/api/users/${id}`);
  }

  async generateTotp(): Promise<string> {
    return this.traccarClient.post<string>('/api/users/totp', {});
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
