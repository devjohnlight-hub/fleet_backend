export class TraccarUser {
  constructor(
    private readonly id: number,
    private readonly name: string,
    private readonly email: string,
    private readonly phone: string | null,
    private readonly readonly_: boolean,
    private readonly administrator: boolean,
    private readonly map: string | null,
    private readonly latitude: number,
    private readonly longitude: number,
    private readonly zoom: number,
    private readonly coordinateFormat: string | null,
    private readonly disabled: boolean,
    private readonly expirationTime: string | null,
    private readonly deviceLimit: number,
    private readonly userLimit: number,
    private readonly deviceReadonly: boolean,
    private readonly limitCommands: boolean,
    private readonly fixedEmail: boolean,
    private readonly poiLayer: string | null,
    private readonly attributes: Record<string, unknown>,
  ) {}

  getId(): number { return this.id; }
  getName(): string { return this.name; }
  getEmail(): string { return this.email; }
  getPhone(): string | null { return this.phone; }
  isReadonly(): boolean { return this.readonly_; }
  isAdministrator(): boolean { return this.administrator; }
  getMap(): string | null { return this.map; }
  getLatitude(): number { return this.latitude; }
  getLongitude(): number { return this.longitude; }
  getZoom(): number { return this.zoom; }
  getCoordinateFormat(): string | null { return this.coordinateFormat; }
  isDisabled(): boolean { return this.disabled; }
  getExpirationTime(): string | null { return this.expirationTime; }
  getDeviceLimit(): number { return this.deviceLimit; }
  getUserLimit(): number { return this.userLimit; }
  isDeviceReadonly(): boolean { return this.deviceReadonly; }
  isLimitCommands(): boolean { return this.limitCommands; }
  isFixedEmail(): boolean { return this.fixedEmail; }
  getPoiLayer(): string | null { return this.poiLayer; }
  getAttributes(): Record<string, unknown> { return this.attributes; }
}
