export class Company {
  constructor(
    private id: string,
    private name: string,
    private address: string,
    private latitude: number,
    private longitude: number,
    private contact: string,
    private email: string,
    private logoUrl: string | null,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date,
  ) {}

  // getters
  getId(): string {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getAddress(): string {
    return this.address;
  }

  getLatitude(): number {
    return this.latitude;
  }
  getLongitude(): number {
    return this.longitude;
  }

  getEmail(): string {
    return this.email;
  }
  getContact(): string {
    return this.contact;
  }

  getLogoUrl(): string | null {
    return this.logoUrl;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date {
    return this.deletedAt;
  }
}
