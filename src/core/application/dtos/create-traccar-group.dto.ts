import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateTraccarGroupDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  groupId?: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
