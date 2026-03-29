import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  apellido?: string;

  @IsOptional()
  @IsEmail()
  @Length(5, 120)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'La contraseña debe incluir mayúscula, minúscula, número y carácter especial',
  })
  password?: string;

  @IsOptional()
  @IsString()
  @Length(10, 255)
  token_fcm?: string;
}
