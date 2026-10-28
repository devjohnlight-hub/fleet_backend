import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

export class AdminDevicesQueryDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsIn(['online', 'offline', 'unknown'])
  status?: 'online' | 'offline' | 'unknown';

  // Devices dont le dernier signal est antérieur à cette date (ou jamais vus)
  @IsOptional()
  @IsISO8601()
  staleBefore?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  neverSeen?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  disabled?: boolean;

  // Devices sans véhicule Firestore rattaché
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  unlinked?: boolean;

  @IsOptional()
  @IsNumberString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AdminDevicePositionsQueryDto {
  @IsISO8601()
  from: string;

  @IsISO8601()
  to: string;
}
