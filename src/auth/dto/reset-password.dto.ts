import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'maria.perez@jepo.com',
    description: 'Email registrado o telefono en formato E.164',
    minLength: 5,
    maxLength: 120,
  })
  @IsString()
  @Length(5, 120)
  email_or_phone!: string;

  @ApiProperty({
    example: '123456',
    description: 'Codigo OTP de 6 digitos',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]{6}$/, { message: 'otp debe contener 6 digitos numericos' })
  otp!: string;

  @ApiProperty({
    example: 'Passw0rd!Segura',
    description:
      'Nueva contrasena. Minimo 8 caracteres, 1 mayuscula y 1 numero.',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'new_password debe tener al menos 1 mayuscula y 1 numero (min 8 caracteres)',
  })
  new_password!: string;
}
