import { TraccarHttpClient, TraccarCredentials } from '../../../infrastructure/traccar/traccar-http.client';
import { TraccarDriver } from '../../domain/entities/traccar-driver.entity';

interface TraccarDriverRaw {
  id: number;
  name: string;
  uniqueId: string;
  attributes: Record<string, unknown>;
}

export class TraccarDriverService {
  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async findAll(
    filters?: { all?: boolean; userId?: number; deviceId?: number; groupId?: number },
    credentials?: TraccarCredentials,
  ): Promise<TraccarDriver[]> {
    const raws = await this.traccarClient.get<TraccarDriverRaw[]>(
      '/api/drivers',
      filters,
      credentials,
    );
    return raws.map((raw) => this.toDomain(raw));
  }

  async create(
    data: { name: string; uniqueId: string; attributes?: Record<string, unknown> },
    credentials?: TraccarCredentials,
  ): Promise<TraccarDriver> {
    const raw = await this.traccarClient.post<TraccarDriverRaw>(
      '/api/drivers',
      data,
      credentials,
    );
    return this.toDomain(raw);
  }

  async update(
    id: number,
    data: Partial<TraccarDriverRaw>,
    credentials?: TraccarCredentials,
  ): Promise<TraccarDriver> {
    const raw = await this.traccarClient.put<TraccarDriverRaw>(
      `/api/drivers/${id}`,
      { id, ...data },
      credentials,
    );
    return this.toDomain(raw);
  }

  async delete(id: number, credentials?: TraccarCredentials): Promise<void> {
    await this.traccarClient.delete(`/api/drivers/${id}`, credentials);
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
