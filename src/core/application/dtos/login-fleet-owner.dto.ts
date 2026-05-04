import { IsEmail, IsString } from 'class-validator';

export class LoginFleetOwnerDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
