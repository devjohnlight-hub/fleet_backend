import { IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { UserType } from '../../domain/entities/firestore-user.entity';

export class UpdateFirestoreUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;

  @IsOptional()
  @IsInt()
  traccarUserId?: number;
}
