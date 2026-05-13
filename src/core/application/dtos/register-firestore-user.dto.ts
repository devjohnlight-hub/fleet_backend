import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserType } from '../../domain/entities/firestore-user.entity';

export class RegisterFirestoreUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

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
}
