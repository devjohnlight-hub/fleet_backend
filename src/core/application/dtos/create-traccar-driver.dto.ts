import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateTraccarDriverDto {
  @IsString()
  name!: string;

  @IsString()
  uniqueId!: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
