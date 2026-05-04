import { FleetOwner } from '../entities/fleet-owner.entity';

export interface IFleetOwnerRepository {
  findById(id: string): Promise<FleetOwner | null>;
  findByEmail(email: string): Promise<FleetOwner | null>;
  findByGoogleId(googleId: string): Promise<FleetOwner | null>;
  findByFacebookId(facebookId: string): Promise<FleetOwner | null>;
  save(fleetOwner: FleetOwner): Promise<FleetOwner>;
}
