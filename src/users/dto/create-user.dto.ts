import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 80)
  nombre: string;

  @IsString()
  @Length(2, 80)
  apellido: string;

  @IsEmail()
  @Length(5, 120)
  email: string;

  @IsString()
  @Length(7, 30)
  telefono: string;

  @IsOptional()
  @IsString()
  @Length(10, 255)
  token_fcm?: string;
}
