import { TraccarHttpClient } from '../../../infrastructure/traccar/traccar-http.client';
import { TraccarGroup } from '../../domain/entities/traccar-group.entity';

interface TraccarGroupRaw {
  id: number;
  name: string;
  groupId: number | null;
  attributes: Record<string, unknown>;
}

export class TraccarGroupService {
  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async findAll(filters?: {
    all?: boolean;
    userId?: number;
    limit?: number;
    offset?: number;
    keyword?: string;
  }): Promise<TraccarGroup[]> {
    const raws = await this.traccarClient.get<TraccarGroupRaw[]>(
      '/api/groups',
      filters,
    );
    return raws.map(this.toDomain);
  }

  async create(data: {
    name: string;
    groupId?: number;
    attributes?: Record<string, unknown>;
  }): Promise<TraccarGroup> {
    console.log(data);
    const raw = await this.traccarClient.post<TraccarGroupRaw>(
      '/api/groups',
      data,
    );
    console.log(raw);
    return this.toDomain(raw);
  }

  async update(
    id: number,
    data: {
      name?: string;
      groupId?: number;
      attributes?: Record<string, unknown>;
    },
  ): Promise<TraccarGroup> {
    const raw = await this.traccarClient.put<TraccarGroupRaw>(
      `/api/groups/${id}`,
      { id, ...data },
    );
    return this.toDomain(raw);
  }

  async delete(id: number): Promise<void> {
    await this.traccarClient.delete(`/api/groups/${id}`);
  }

  private toDomain(raw: TraccarGroupRaw): TraccarGroup {
    return new TraccarGroup(
      raw.id,
      raw.name,
      raw.groupId ?? null,
      raw.attributes ?? {},
    );
  }
}
