import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'expired', 'cancelled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// Toute mutation admin exige un motif, consigné dans admin_audit_logs
export class AdminReasonDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason: string;
}

export class AdminClientAccessDto extends AdminReasonDto {
  @IsBoolean()
  disabled: boolean;
}

export class AdminSubscriptionAdjustmentDto extends AdminReasonDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  planId?: string;

  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}

// `disabled` passe par /disable et /enable, `attributes` n'est pas modifiable ici
export class AdminUpdateDeviceDto extends AdminReasonDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  uniqueId?: string;

  @IsOptional()
  @IsInt()
  groupId?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class AdminLinkDeviceDto extends AdminReasonDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
