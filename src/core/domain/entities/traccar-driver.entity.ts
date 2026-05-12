export class TraccarDriver {
  constructor(
    private readonly id: number,
    private readonly name: string,
    private readonly uniqueId: string,
    private readonly attributes: Record<string, unknown>,
  ) {}

  getId(): number { return this.id; }
  getName(): string { return this.name; }
  getUniqueId(): string { return this.uniqueId; }
  getAttributes(): Record<string, unknown> { return this.attributes; }
}
