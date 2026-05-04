import { VehiculeStatus, VehiculeType } from './vehicule.types';

export class Vehicule {
  constructor(
    private readonly id: string,
    private readonly fleetOwnerId: string,
    private type: VehiculeType,
    private immatriculation: string,
    private marque: string,
    private modele: string,
    private annee: number,
    private statut: VehiculeStatus,
    private photoUrl: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null,
  ) {}

  // DEFINITION DES GETTERS
  getId(): string {
    return this.id;
  }
  getFleetOwnerId(): string {
    return this.fleetOwnerId;
  }
  getType(): VehiculeType {
    return this.type;
  }
  getImmatriculation(): string {
    return this.immatriculation;
  }
  getMarque(): string {
    return this.marque;
  }
  getModele(): string {
    return this.modele;
  }
  getAnnee(): number {
    return this.annee;
  }
  getStatut(): VehiculeStatus {
    return this.statut;
  }
  getPhotoUrl(): string | null {
    return this.photoUrl;
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

  // METHODES METIERS
  mettreEnMaintenance(): void {
    if (this.statut === VehiculeStatus.HORS_SERVICE) {
      throw new Error(
        'Un véhicule hors service ne peut pas être mis en maintenance',
      );
    }
    this.statut = VehiculeStatus.MAINTENANCE;
    this.updatedAt = new Date();
  }

  activer(): void {
    if (this.statut === VehiculeStatus.HORS_SERVICE) {
      throw new Error(
        'Un véhicule hors service ne peut pas être réactivé directement',
      );
    }
    this.statut = VehiculeStatus.ACTIF;
    this.updatedAt = new Date();
  }

  mettreHorsService(): void {
    this.statut = VehiculeStatus.HORS_SERVICE;
    this.updatedAt = new Date();
  }

  updatePhoto(url: string): void {
    this.photoUrl = url;
    this.updatedAt = new Date();
  }

  updateInfos(data: {
    type?: VehiculeType;
    immatriculation?: string;
    marque?: string;
    modele?: string;
    annee?: number;
    statut?: VehiculeStatus;
    photoUrl?: string;
  }): void {
    if (data.type !== undefined) this.type = data.type;
    if (data.immatriculation !== undefined)
      this.immatriculation = data.immatriculation;
    if (data.marque !== undefined) this.marque = data.marque;
    if (data.modele !== undefined) this.modele = data.modele;
    if (data.annee !== undefined) this.annee = data.annee;
    if (data.statut !== undefined) this.statut = data.statut;
    if (data.photoUrl !== undefined) this.photoUrl = data.photoUrl;
    this.updatedAt = new Date();
  }
}
