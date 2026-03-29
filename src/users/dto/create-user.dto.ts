import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

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

  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'La contraseña debe incluir mayúscula, minúscula, número y carácter especial',
  })
  password: string;

  @IsOptional()
  @IsString()
  @Length(10, 255)
  token_fcm?: string;
}
