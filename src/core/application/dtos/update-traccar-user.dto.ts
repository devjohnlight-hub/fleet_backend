import {
  IsBoolean,
  IsEmail,
  IsISO8601,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateTraccarUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  administrator?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly?: boolean;

  @IsOptional()
  @IsString()
  map?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsInt()
  zoom?: number;

  @IsOptional()
  @IsString()
  coordinateFormat?: string;

  @IsOptional()
  @IsBoolean()
  disabled?: boolean;

  @IsOptional()
  @IsISO8601()
  expirationTime?: string;

  @IsOptional()
  @IsInt()
  deviceLimit?: number;

  @IsOptional()
  @IsInt()
  userLimit?: number;

  @IsOptional()
  @IsBoolean()
  deviceReadonly?: boolean;

  @IsOptional()
  @IsBoolean()
  limitCommands?: boolean;

  @IsOptional()
  @IsBoolean()
  fixedEmail?: boolean;

  @IsOptional()
  @IsString()
  poiLayer?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
