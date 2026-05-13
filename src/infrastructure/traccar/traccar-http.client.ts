import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TraccarCredentials {
  email: string;
  password: string;
}

@Injectable()
export class TraccarHttpClient {
  readonly baseUrl: string;
  private readonly adminAuthHeader: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('TRACCAR_URL');
    const user = this.configService.getOrThrow<string>('TRACCAR_USER');
    const password = this.configService.getOrThrow<string>('TRACCAR_PASSWORD');
    this.adminAuthHeader = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
  }

  private buildAuth(credentials?: TraccarCredentials): string {
    if (credentials) {
      return `Basic ${Buffer.from(`${credentials.email}:${credentials.password}`).toString('base64')}`;
    }
    return this.adminAuthHeader;
  }

  private signal(): AbortSignal {
    return AbortSignal.timeout(10_000);
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    credentials?: TraccarCredentials,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const response = await fetch(url.toString(), {
      headers: { Authorization: this.buildAuth(credentials) },
      signal: this.signal(),
    });
    if (!response.ok) {
      throw new Error(`Traccar GET ${path} failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async post<T>(
    path: string,
    body: unknown,
    credentials?: TraccarCredentials,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: this.buildAuth(credentials),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: this.signal(),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Traccar POST ${path} failed: ${response.status} — ${errorBody}`,
      );
    }
    return response.json() as Promise<T>;
  }

  async put<T>(
    path: string,
    body: unknown,
    credentials?: TraccarCredentials,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        Authorization: this.buildAuth(credentials),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: this.signal(),
    });
    if (!response.ok) {
      throw new Error(`Traccar PUT ${path} failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async postForm<T>(
    path: string,
    fields: Record<string, string>,
    credentials?: TraccarCredentials,
  ): Promise<T> {
    const body = new URLSearchParams(fields).toString();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: this.buildAuth(credentials),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: this.signal(),
    });
    if (!response.ok) {
      throw new Error(`Traccar POST FORM ${path} failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async delete(path: string, credentials?: TraccarCredentials): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: { Authorization: this.buildAuth(credentials) },
      signal: this.signal(),
    });
    if (!response.ok) {
      throw new Error(`Traccar DELETE ${path} failed: ${response.status}`);
    }
  }

  async linkDeviceToUser(
    traccarUserId: number,
    traccarDeviceId: number,
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/permissions`, {
      method: 'POST',
      headers: {
        Authorization: this.adminAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: traccarUserId,
        deviceId: traccarDeviceId,
      }),
      signal: this.signal(),
    });
    if (!response.ok) {
      throw new Error(`Traccar link device to user failed: ${response.status}`);
    }
  }

  async getSessionCookie(email: string, password: string): Promise<string> {
    const body = new URLSearchParams({ email, password }).toString();
    const response = await fetch(`${this.baseUrl}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: this.signal(),
    });
    if (!response.ok) {
      throw new Error(`Traccar session failed: ${response.status}`);
    }
    const cookie = response.headers.get('set-cookie');
    if (!cookie) throw new Error('Traccar did not return a session cookie');
    return cookie;
  }
}
