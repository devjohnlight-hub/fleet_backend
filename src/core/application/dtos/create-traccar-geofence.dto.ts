import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateTraccarGeofenceDto {
  @IsString()
  name!: string;

  @IsString()
  area!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  calendarId?: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
