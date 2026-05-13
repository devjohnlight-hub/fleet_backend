export class TraccarDevice {
  constructor(
    private readonly id: number,
    private readonly name: string,
    private readonly uniqueId: string,
    private readonly status: string | null,
    private readonly disabled: boolean,
    private readonly lastUpdate: string | null,
    private readonly positionId: number | null,
    private readonly groupId: number | null,
    private readonly phone: string | null,
    private readonly model: string | null,
    private readonly contact: string | null,
    private readonly category: string | null,
    private readonly attributes: Record<string, unknown>,
  ) {}

  getId(): number {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getUniqueId(): string {
    return this.uniqueId;
  }
  getStatus(): string | null {
    return this.status;
  }
  isDisabled(): boolean {
    return this.disabled;
  }
  getLastUpdate(): string | null {
    return this.lastUpdate;
  }
  getPositionId(): number | null {
    return this.positionId;
  }
  getGroupId(): number | null {
    return this.groupId;
  }
  getPhone(): string | null {
    return this.phone;
  }
  getModel(): string | null {
    return this.model;
  }
  getContact(): string | null {
    return this.contact;
  }
  getCategory(): string | null {
    return this.category;
  }
  getAttributes(): Record<string, unknown> {
    return this.attributes;
  }
}
