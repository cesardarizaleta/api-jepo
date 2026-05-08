import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'maria.perez@jepo.com',
    description: 'Correo del usuario registrado',
    minLength: 5,
    maxLength: 120,
  })
  @IsEmail()
  @Length(5, 120)
  email: string;

  @ApiProperty({
    example: 'Passw0rd!Segura',
    description: 'Contrasena del usuario',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @Length(8, 72)
  password: string;
}
