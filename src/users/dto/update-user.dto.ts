import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Cesar', minLength: 2, maxLength: 80 })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Perez', minLength: 2, maxLength: 80 })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  apellido?: string;

  @ApiPropertyOptional({
    example: 'cesar@correo.com',
    format: 'email',
    minLength: 5,
    maxLength: 120,
  })
  @IsOptional()
  @IsEmail()
  @Length(5, 120)
  email?: string;

  @ApiPropertyOptional({
    example: '+56912345678',
    minLength: 7,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono?: string;

  @ApiPropertyOptional({
    example: 'Passw0rd!Segura',
    minLength: 8,
    maxLength: 72,
  })
  @IsOptional()
  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'La contraseña debe incluir mayúscula, minúscula, número y carácter especial',
  })
  password?: string;

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
