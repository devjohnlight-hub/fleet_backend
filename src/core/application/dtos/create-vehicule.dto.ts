import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { VehiculeType } from '../../domain/entities/vehicule.types';

const CURRENT_YEAR = new Date().getFullYear();

export class CreateVehiculeDto {
  @IsString()
  fleetOwnerId!: string;

  @IsEnum(VehiculeType)
  type!: VehiculeType;

  @IsString()
  immatriculation!: string;

  @IsString()
  marque!: string;

  @IsString()
  modele!: string;

  @IsInt()
  @Min(1900)
  @Max(CURRENT_YEAR)
  annee!: number;

  @IsOptional()
  @IsString()
  photoUrl!: string | null;
}
