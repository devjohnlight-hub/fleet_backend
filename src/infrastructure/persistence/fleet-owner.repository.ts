import { Injectable } from '@nestjs/common';
import { IFleetOwnerRepository } from '../../core/domain/repositories/fleet-owner.repository.interface';
import { FleetOwner } from '../../core/domain/entities/fleet-owner.entity';
import { PrismaService } from './prisma.service';

@Injectable()
export class FleetOwnerRepository implements IFleetOwnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<FleetOwner | null> {
    const row = await this.prisma.fleetOwner.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<FleetOwner | null> {
    const row = await this.prisma.fleetOwner.findUnique({ where: { email } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByGoogleId(googleId: string): Promise<FleetOwner | null> {
    const row = await this.prisma.fleetOwner.findUnique({
      where: { googleId },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByFacebookId(facebookId: string): Promise<FleetOwner | null> {
    const row = await this.prisma.fleetOwner.findUnique({
      where: { facebookId },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(fleetOwner: FleetOwner): Promise<FleetOwner> {
    const row = await this.prisma.fleetOwner.create({
      data: {
        id: fleetOwner.getId(),
        name: fleetOwner.getName(),
        email: fleetOwner.getEmail(),
        password: fleetOwner.getPassword(),
        googleId: fleetOwner.getGoogleId(),
        facebookId: fleetOwner.getFacebookId(),
        createdAt: fleetOwner.getCreatedAt(),
        updatedAt: fleetOwner.getUpdatedAt(),
        deletedAt: fleetOwner.getDeletedAt(),
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: any): FleetOwner {
    return new FleetOwner(
      row.id,
      row.name,
      row.email,
      row.password,
      row.googleId,
      row.facebookId,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
