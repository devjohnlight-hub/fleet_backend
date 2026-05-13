import { IsEmail, IsString } from 'class-validator';

export class LoginFirestoreUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
