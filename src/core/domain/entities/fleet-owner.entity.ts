export class FleetOwner {
  constructor(
    private readonly id: string,
    private name: string,
    private readonly email: string,
    private password: string | null,
    private readonly googleId: string | null,
    private readonly facebookId: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  getPassword(): string | null {
    return this.password;
  }

  getGoogleId(): string | null {
    return this.googleId;
  }

  getFacebookId(): string | null {
    return this.facebookId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }
}
