import { FirestoreService } from '../../../infrastructure/firebase/firestore.service';
import {
  FirestoreVehicle,
  VehicleStatus,
  VehicleType,
} from '../../domain/entities/firestore-vehicle.entity';

const COLLECTION = 'vehicles';

interface VehicleRaw {
  id: string;
  brand: string;
  color: string;
  label: string;
  ownerId: string;
  plate: string;
  registrationNumber: string;
  status: VehicleStatus;
  type: VehicleType;
  year: number;
  photoUrl: string | null;
  vin: string | null;
  createdAt: string | null;
  deviceId: string | null;
}

export class FirestoreVehicleService {
  constructor(private readonly firestoreService: FirestoreService) {}

  async findAll(): Promise<FirestoreVehicle[]> {
    const raws = await this.firestoreService.findAll<VehicleRaw>(COLLECTION);
    return raws.map((raw) => this.toDomain(raw));
  }

  async findById(id: string): Promise<FirestoreVehicle | null> {
    const raw = await this.firestoreService.findById<VehicleRaw>(
      COLLECTION,
      id,
    );
    return raw ? this.toDomain(raw) : null;
  }

  async findByOwnerId(ownerId: string): Promise<FirestoreVehicle[]> {
    const raws = await this.firestoreService.findWhere<VehicleRaw>(
      COLLECTION,
      'ownerId',
      ownerId,
    );
    return raws.map((raw) => this.toDomain(raw));
  }

  async create(
    data: Omit<VehicleRaw, 'id' | 'createdAt'>,
  ): Promise<FirestoreVehicle> {
    const raw = await this.firestoreService.create<VehicleRaw>(COLLECTION, {
      ...data,
      createdAt: null,
    });
    return this.toDomain(raw);
  }

  async update(
    id: string,
    data: Partial<VehicleRaw>,
  ): Promise<FirestoreVehicle> {
    const raw = await this.firestoreService.update<VehicleRaw>(
      COLLECTION,
      id,
      data,
    );
    return this.toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.firestoreService.delete(COLLECTION, id);
  }

  private toDomain(raw: VehicleRaw): FirestoreVehicle {
    return new FirestoreVehicle(
      raw.id,
      raw.brand,
      raw.color,
      raw.label,
      raw.ownerId,
      raw.plate,
      raw.registrationNumber,
      raw.status,
      raw.type,
      raw.year,
      raw.photoUrl ?? null,
      raw.vin ?? null,
      raw.createdAt ?? null,
      raw.deviceId ?? null,
    );
  }
}
