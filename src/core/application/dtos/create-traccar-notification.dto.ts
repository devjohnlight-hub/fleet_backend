import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTraccarNotificationDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsBoolean()
  always?: boolean;

  @IsOptional()
  @IsString()
  notificators?: string;

  @IsOptional()
  @IsInt()
  calendarId?: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
