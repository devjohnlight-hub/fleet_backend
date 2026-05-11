export class TraccarGroup {
  constructor(
    private readonly id: number,
    private readonly name: string,
    private readonly groupId: number | null,
    private readonly attributes: Record<string, unknown>,
  ) {}

  getId(): number {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getGroupId(): number | null {
    return this.groupId;
  }

  getAttributes(): Record<string, unknown> {
    return this.attributes;
  }
}
