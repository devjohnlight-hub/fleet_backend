import { Injectable } from '@nestjs/common';
import { IVehiculeRepository } from '../../core/domain/repositories/vehicule.repository.interface';
import { Vehicule } from '../../core/domain/entities/vehicule.entity';
import {
  VehiculeStatus,
  VehiculeType,
} from '../../core/domain/entities/vehicule.types';
import { PrismaService } from './prisma.service';

@Injectable()
export class VehiculeRepository implements IVehiculeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Vehicule | null> {
    const row = await this.prisma.vehicule.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(fleetOwnerId: string): Promise<Vehicule[]> {
    const rows = await this.prisma.vehicule.findMany({
      where: { fleetOwnerId },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByImmatriculation(
    immatriculation: string,
  ): Promise<Vehicule | null> {
    const row = await this.prisma.vehicule.findUnique({
      where: { immatriculation },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(vehicule: Vehicule): Promise<Vehicule> {
    const row = await this.prisma.vehicule.create({
      data: {
        id: vehicule.getId(),
        fleetOwnerId: vehicule.getFleetOwnerId(),
        type: vehicule.getType(),
        immatriculation: vehicule.getImmatriculation(),
        marque: vehicule.getMarque(),
        modele: vehicule.getModele(),
        annee: vehicule.getAnnee(),
        statut: vehicule.getStatut(),
        photoUrl: vehicule.getPhotoUrl(),
        createdAt: vehicule.getCreatedAt(),
        updatedAt: vehicule.getUpdatedAt(),
        deletedAt: vehicule.getDeletedAt(),
      },
    });
    return this.toDomain(row);
  }

  async update(vehicule: Vehicule): Promise<Vehicule> {
    const row = await this.prisma.vehicule.update({
      where: { id: vehicule.getId() },
      data: {
        type: vehicule.getType(),
        immatriculation: vehicule.getImmatriculation(),
        marque: vehicule.getMarque(),
        modele: vehicule.getModele(),
        annee: vehicule.getAnnee(),
        statut: vehicule.getStatut(),
        photoUrl: vehicule.getPhotoUrl(),
        updatedAt: vehicule.getUpdatedAt(),
        deletedAt: vehicule.getDeletedAt(),
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vehicule.delete({ where: { id } });
  }

  private toDomain(row: any): Vehicule {
    return new Vehicule(
      row.id,
      row.fleetOwnerId,
      row.type as VehiculeType,
      row.immatriculation,
      row.marque,
      row.modele,
      row.annee,
      row.statut as VehiculeStatus,
      row.photoUrl,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
