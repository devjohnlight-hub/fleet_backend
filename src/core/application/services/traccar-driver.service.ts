import { TraccarHttpClient } from '../../../infrastructure/traccar/traccar-http.client';
import { TraccarDriver } from '../../domain/entities/traccar-driver.entity';

interface TraccarDriverRaw {
  id: number;
  name: string;
  uniqueId: string;
  attributes: Record<string, unknown>;
}

export class TraccarDriverService {
  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async findAll(filters?: {
    all?: boolean;
    userId?: number;
    deviceId?: number;
    groupId?: number;
  }): Promise<TraccarDriver[]> {
    const raws = await this.traccarClient.get<TraccarDriverRaw[]>(
      '/api/drivers',
      filters,
    );
    return raws.map((raw) => this.toDomain(raw));
  }

  async create(data: {
    name: string;
    uniqueId: string;
    attributes?: Record<string, unknown>;
  }): Promise<TraccarDriver> {
    const raw = await this.traccarClient.post<TraccarDriverRaw>(
      '/api/drivers',
      data,
    );
    return this.toDomain(raw);
  }

  async update(id: number, data: Partial<TraccarDriverRaw>): Promise<TraccarDriver> {
    const raw = await this.traccarClient.put<TraccarDriverRaw>(
      `/api/drivers/${id}`,
      { id, ...data },
    );
    return this.toDomain(raw);
  }

  async delete(id: number): Promise<void> {
    await this.traccarClient.delete(`/api/drivers/${id}`);
  }

  private toDomain(raw: TraccarDriverRaw): TraccarDriver {
    return new TraccarDriver(
      raw.id,
      raw.name,
      raw.uniqueId,
      raw.attributes ?? {},
    );
  }
}
