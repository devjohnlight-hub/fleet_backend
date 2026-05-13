import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { VehicleStatus, VehicleType } from '../../domain/entities/firestore-vehicle.entity';

export class CreateFirestoreVehicleDto {
  @IsString()
  brand!: string;

  @IsString()
  color!: string;

  @IsString()
  label!: string;

  @IsString()
  ownerId!: string;

  @IsString()
  plate!: string;

  @IsString()
  registrationNumber!: string;

  @IsEnum(VehicleStatus)
  status!: VehicleStatus;

  @IsEnum(VehicleType)
  type!: VehicleType;

  @IsInt()
  year!: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  vin?: string;
}
