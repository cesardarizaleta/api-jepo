import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCedula } from '../../common/validators/cedula.validator';
import { normalizeCedula } from '../../common/utils/cedula.util';

export class CreateUserDto {
  @ApiProperty({
    example: 12123456,
    description: 'Cedula del usuario',
  })
  @IsCedula({ message: 'Cédula inválida' })
  @Transform(({ value }) => {
    const n = normalizeCedula(value);
    return n === null ? null : Number(n);
  }, { toClassOnly: true })
  cedula: number;

  @ApiProperty({
    example: 'Maria',
    description: 'Nombre del usuario',
  })
  @IsString()
  @Length(2, 80)
  nombre: string;

  @ApiProperty({
    example: 'Perez',
    description: 'Apellido del usuario',
  })
  @IsString()
  @Length(2, 80)
  apellido: string;

  @ApiProperty({
    example: 'maria.perez@jepo.com',
    description: 'Correo unico del usuario',
  })
  @IsEmail()
  @Length(5, 120)
  email: string;

  @ApiProperty({
    example: '+584121112233',
    description: 'Telefono principal del usuario',
  })
  @IsString()
  @Length(7, 30)
  telefono: string;

  @ApiProperty({
    example: 'MiClave#2026',
    description: 'Contrasena fuerte del usuario',
  })
  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'La contraseña debe incluir mayúscula, minúscula, número y carácter especial',
  })
  password: string;

  @ApiPropertyOptional({
    example: 'fcm_token_ABC123XYZ',
    description: 'Token FCM para notificaciones push',
  })
  @IsOptional()
  @IsString()
  @Length(10, 255)
  token_fcm?: string;
}
