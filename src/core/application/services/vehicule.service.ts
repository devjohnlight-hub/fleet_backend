import { IVehiculeRepository } from '../../domain/repositories/vehicule.repository.interface';
import { Vehicule } from '../../domain/entities/vehicule.entity';
import {
  VehiculeStatus,
  VehiculeType,
} from '../../domain/entities/vehicule.types';

export class VehiculeService {
  constructor(private readonly vehiculeRepository: IVehiculeRepository) {}

  async findById(id: string): Promise<Vehicule | null> {
    return this.vehiculeRepository.findById(id);
  }

  async findAll(fleetOwnerId: string): Promise<Vehicule[]> {
    return this.vehiculeRepository.findAll(fleetOwnerId);
  }

  async create(
    fleetOwnerId: string,
    type: VehiculeType,
    immatriculation: string,
    marque: string,
    modele: string,
    annee: number,
    photoUrl: string | null,
  ): Promise<Vehicule> {
    const existing =
      await this.vehiculeRepository.findByImmatriculation(immatriculation);
    if (existing) {
      throw new Error(`Immatriculation ${immatriculation} déjà utilisée`);
    }

    const vehicule = new Vehicule(
      crypto.randomUUID(),
      fleetOwnerId,
      type,
      immatriculation,
      marque,
      modele,
      annee,
      VehiculeStatus.ACTIF,
      photoUrl,
      new Date(),
      new Date(),
      null,
    );

    return this.vehiculeRepository.save(vehicule);
  }
}
