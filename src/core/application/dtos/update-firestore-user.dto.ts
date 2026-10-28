import { IsEmail, IsOptional, IsString } from 'class-validator';

// role, userType et traccarUserId ne sont pas modifiables par l'utilisateur :
// traccarUserId est posé par POST /traccar/users et lu par TraccarLinkedGuard
export class UpdateFirestoreUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

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
