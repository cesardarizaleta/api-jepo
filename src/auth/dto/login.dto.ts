import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'maria.perez@jepo.com',
    description: 'Correo del usuario registrado',
  })
  @IsEmail()
  @Length(5, 120)
  email: string;

  @ApiProperty({
    example: 'MiClave#2026',
    description: 'Contrasena del usuario',
  })
  @IsString()
  @Length(8, 72)
  password: string;
}
