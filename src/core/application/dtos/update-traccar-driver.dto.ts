import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateTraccarDriverDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  uniqueId?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
