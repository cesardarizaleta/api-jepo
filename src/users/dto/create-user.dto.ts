import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsCedula } from '../../common/validators/cedula.validator';
import { normalizeCedula } from '../../common/utils/cedula.util';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'V-12345678',
    description: 'Cedula del usuario. Se normaliza internamente.',
  })
  @IsCedula({ message: 'Cédula inválida' })
  @Transform(({ value }) => {
    const n = normalizeCedula(value);
    return n === null ? null : Number(n);
  }, { toClassOnly: true })
  cedula: number;

  @ApiProperty({ example: 'Cesar', minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80)
  nombre: string;

  @ApiProperty({ example: 'Perez', minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80)
  apellido: string;

  @ApiProperty({
    example: 'cesar@correo.com',
    format: 'email',
    minLength: 5,
    maxLength: 120,
  })
  @IsEmail()
  @Length(5, 120)
  email: string;

  @ApiProperty({ example: '+56912345678', minLength: 7, maxLength: 30 })
  @IsString()
  @Length(7, 30)
  telefono: string;

  @ApiProperty({
    example: 'Passw0rd!Segura',
    minLength: 8,
    maxLength: 72,
    description:
      'Debe incluir mayuscula, minuscula, numero y caracter especial.',
  })
  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'La contraseña debe incluir mayúscula, minúscula, número y carácter especial',
  })
  password: string;

  @ApiPropertyOptional({
    example: 'fcm_device_token_abc123456789',
    minLength: 10,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(10, 255)
  token_fcm?: string;
}
