import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'usuario@correo.com',
    minLength: 5,
    maxLength: 120,
  })
  @IsEmail()
  @Length(5, 120)
  email: string;

  @ApiProperty({
    example: 'Passw0rd!Segura',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @Length(8, 72)
  password: string;
}
