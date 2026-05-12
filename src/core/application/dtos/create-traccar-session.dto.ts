import { IsEmail, IsString } from 'class-validator';

export class CreateTraccarSessionDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
