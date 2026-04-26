export class CreateVehiculeDto {
  fleetOwnerId: string;
  type: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  photoUrl: string | null;
}
