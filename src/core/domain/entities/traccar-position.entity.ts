export class TraccarPosition {
  constructor(
    private readonly id: number,
    private readonly deviceId: number,
    private readonly protocol: string | null,
    private readonly serverTime: string,
    private readonly deviceTime: string,
    private readonly fixTime: string,
    private readonly outdated: boolean,
    private readonly valid: boolean,
    private readonly latitude: number,
    private readonly longitude: number,
    private readonly altitude: number,
    private readonly speed: number,
    private readonly course: number,
    private readonly address: string | null,
    private readonly accuracy: number,
    private readonly attributes: Record<string, unknown>,
  ) {}

  getId(): number { return this.id; }
  getDeviceId(): number { return this.deviceId; }
  getProtocol(): string | null { return this.protocol; }
  getServerTime(): string { return this.serverTime; }
  getDeviceTime(): string { return this.deviceTime; }
  getFixTime(): string { return this.fixTime; }
  isOutdated(): boolean { return this.outdated; }
  isValid(): boolean { return this.valid; }
  getLatitude(): number { return this.latitude; }
  getLongitude(): number { return this.longitude; }
  getAltitude(): number { return this.altitude; }
  getSpeed(): number { return this.speed; }
  getCourse(): number { return this.course; }
  getAddress(): string | null { return this.address; }
  getAccuracy(): number { return this.accuracy; }
  getAttributes(): Record<string, unknown> { return this.attributes; }
}
