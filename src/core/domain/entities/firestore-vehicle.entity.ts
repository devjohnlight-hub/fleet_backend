export enum VehicleType {
  VOITURE = 'Voiture',
  MOTO = 'Moto',
  FOURGON = 'Fourgon',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export class FirestoreVehicle {
  constructor(
    private readonly id: string,
    private readonly brand: string,
    private readonly color: string,
    private readonly label: string,
    private readonly ownerId: string,
    private readonly plate: string,
    private readonly registrationNumber: string,
    private readonly status: VehicleStatus,
    private readonly type: VehicleType,
    private readonly year: number,
    private readonly photoUrl: string | null,
    private readonly vin: string | null,
    private readonly createdAt: string | null,
    private readonly deviceId: string | null,
  ) {}

  getId(): string {
    return this.id;
  }

  getBrand(): string {
    return this.brand;
  }

  getColor(): string {
    return this.color;
  }

  getLabel(): string {
    return this.label;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getPlate(): string {
    return this.plate;
  }

  getRegistrationNumber(): string {
    return this.registrationNumber;
  }

  getStatus(): VehicleStatus {
    return this.status;
  }

  getType(): VehicleType {
    return this.type;
  }

  getYear(): number {
    return this.year;
  }

  getPhotoUrl(): string | null {
    return this.photoUrl;
  }

  getVin(): string | null {
    return this.vin;
  }

  getCreatedAt(): string | null {
    return this.createdAt;
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }
}
