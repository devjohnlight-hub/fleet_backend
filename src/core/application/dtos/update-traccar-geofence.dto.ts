import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateTraccarGeofenceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  area?: string;

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
