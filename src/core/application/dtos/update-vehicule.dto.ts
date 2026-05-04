import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { VehiculeType, VehiculeStatus } from '../../domain/entities/vehicule.types';

const CURRENT_YEAR = new Date().getFullYear();

export class UpdateVehiculeDto {
  @IsOptional()
  @IsEnum(VehiculeType)
  type?: VehiculeType;

  @IsOptional()
  @IsString()
  immatriculation?: string;

  @IsOptional()
  @IsString()
  marque?: string;

  @IsOptional()
  @IsString()
  modele?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(CURRENT_YEAR)
  annee?: number;

  @IsOptional()
  @IsEnum(VehiculeStatus)
  statut?: VehiculeStatus;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
