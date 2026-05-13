import { TraccarHttpClient, TraccarCredentials } from '../../../infrastructure/traccar/traccar-http.client';
import { TraccarDevice } from '../../domain/entities/traccar-device.entity';

interface TraccarDeviceRaw {
  id: number;
  name: string;
  uniqueId: string;
  status: string | null;
  disabled: boolean;
  lastUpdate: string | null;
  positionId: number | null;
  groupId: number | null;
  phone: string | null;
  model: string | null;
  contact: string | null;
  category: string | null;
  attributes: Record<string, unknown>;
}

export class TraccarDeviceService {
  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async findAll(
    filters?: { all?: boolean; userId?: number; id?: number; uniqueId?: string },
    credentials?: TraccarCredentials,
  ): Promise<TraccarDevice[]> {
    const raws = await this.traccarClient.get<TraccarDeviceRaw[]>(
      '/api/devices',
      filters,
      credentials,
    );
    return raws.map((raw) => this.toDomain(raw));
  }

  async create(
    data: {
      name: string;
      uniqueId: string;
      disabled?: boolean;
      groupId?: number;
      phone?: string;
      model?: string;
      contact?: string;
      category?: string;
      attributes?: Record<string, unknown>;
    },
    credentials?: TraccarCredentials,
  ): Promise<TraccarDevice> {
    const raw = await this.traccarClient.post<TraccarDeviceRaw>(
      '/api/devices',
      data,
      credentials,
    );
    return this.toDomain(raw);
  }

  async update(
    id: number,
    data: Partial<TraccarDeviceRaw>,
    credentials?: TraccarCredentials,
  ): Promise<TraccarDevice> {
    const raw = await this.traccarClient.put<TraccarDeviceRaw>(
      `/api/devices/${id}`,
      { id, ...data },
      credentials,
    );
    return this.toDomain(raw);
  }

  async delete(id: number, credentials?: TraccarCredentials): Promise<void> {
    await this.traccarClient.delete(`/api/devices/${id}`, credentials);
  }

  private toDomain(raw: TraccarDeviceRaw): TraccarDevice {
    return new TraccarDevice(
      raw.id,
      raw.name,
      raw.uniqueId,
      raw.status ?? null,
      raw.disabled ?? false,
      raw.lastUpdate ?? null,
      raw.positionId ?? null,
      raw.groupId ?? null,
      raw.phone ?? null,
      raw.model ?? null,
      raw.contact ?? null,
      raw.category ?? null,
      raw.attributes ?? {},
    );
  }
}
