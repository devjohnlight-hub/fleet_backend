import { Vehicule } from '../entities/vehicule.entity';

export interface IVehiculeRepository {
  findById(id: string): Promise<Vehicule | null>;
  findAll(fleetOwnerId: string): Promise<Vehicule[]>;
  findByImmatriculation(immatriculation: string): Promise<Vehicule | null>;
  save(vehicule: Vehicule): Promise<Vehicule>;
  update(vehicule: Vehicule): Promise<Vehicule>;
  delete(id: string): Promise<void>;
}
