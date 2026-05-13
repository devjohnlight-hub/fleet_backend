import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserType } from '../../domain/entities/firestore-user.entity';

export class CreateFirestoreUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  role!: string;

  @IsEnum(UserType)
  userType!: UserType;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;
}
