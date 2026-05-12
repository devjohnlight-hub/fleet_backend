import { TraccarHttpClient } from '../../../infrastructure/traccar/traccar-http.client';
import { TraccarNotification } from '../../domain/entities/traccar-notification.entity';

interface TraccarNotificationRaw {
  id: number;
  type: string;
  always: boolean;
  notificators: string;
  calendarId: number | null;
  attributes: Record<string, unknown>;
}

export class TraccarNotificationService {
  constructor(private readonly traccarClient: TraccarHttpClient) {}

  async findAll(filters?: {
    all?: boolean;
    userId?: number;
    deviceId?: number;
    groupId?: number;
    refresh?: boolean;
  }): Promise<TraccarNotification[]> {
    const raws = await this.traccarClient.get<TraccarNotificationRaw[]>(
      '/api/notifications',
      filters,
    );
    return raws.map((raw) => this.toDomain(raw));
  }

  async getTypes(): Promise<{ type: string }[]> {
    return this.traccarClient.get<{ type: string }[]>('/api/notifications/types');
  }

  async sendTest(notificator: string): Promise<void> {
    await this.traccarClient.post(`/api/notifications/test/${notificator}`, {});
  }

  async create(data: {
    type: string;
    always?: boolean;
    notificators?: string;
    calendarId?: number;
    attributes?: Record<string, unknown>;
  }): Promise<TraccarNotification> {
    const raw = await this.traccarClient.post<TraccarNotificationRaw>(
      '/api/notifications',
      data,
    );
    return this.toDomain(raw);
  }

  async update(id: number, data: Partial<TraccarNotificationRaw>): Promise<TraccarNotification> {
    const raw = await this.traccarClient.put<TraccarNotificationRaw>(
      `/api/notifications/${id}`,
      { id, ...data },
    );
    return this.toDomain(raw);
  }

  async delete(id: number): Promise<void> {
    await this.traccarClient.delete(`/api/notifications/${id}`);
  }

  private toDomain(raw: TraccarNotificationRaw): TraccarNotification {
    return new TraccarNotification(
      raw.id,
      raw.type,
      raw.always ?? false,
      raw.notificators ?? '',
      raw.calendarId ?? null,
      raw.attributes ?? {},
    );
  }
}
