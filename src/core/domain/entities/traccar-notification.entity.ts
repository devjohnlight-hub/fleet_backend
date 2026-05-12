export class TraccarNotification {
  constructor(
    private readonly id: number,
    private readonly type: string,
    private readonly always: boolean,
    private readonly notificators: string,
    private readonly calendarId: number | null,
    private readonly attributes: Record<string, unknown>,
  ) {}

  getId(): number { return this.id; }
  getType(): string { return this.type; }
  isAlways(): boolean { return this.always; }
  getNotificators(): string { return this.notificators; }
  getCalendarId(): number | null { return this.calendarId; }
  getAttributes(): Record<string, unknown> { return this.attributes; }
}
