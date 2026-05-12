export class TraccarGeofence {
  constructor(
    private readonly id: number,
    private readonly name: string,
    private readonly description: string | null,
    private readonly area: string,
    private readonly calendarId: number | null,
    private readonly attributes: Record<string, unknown>,
  ) {}

  getId(): number { return this.id; }
  getName(): string { return this.name; }
  getDescription(): string | null { return this.description; }
  getArea(): string { return this.area; }
  getCalendarId(): number | null { return this.calendarId; }
  getAttributes(): Record<string, unknown> { return this.attributes; }
}
