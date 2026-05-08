import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Maria Elena' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Perez Rojas' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  apellido?: string;

  @ApiPropertyOptional({ example: 'maria.actualizada@jepo.com' })
  @IsOptional()
  @IsEmail()
  @Length(5, 120)
  email?: string;

  @ApiPropertyOptional({ example: '+584241112233' })
  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'NuevaClave#2026' })
  @IsOptional()
  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'La contraseña debe incluir mayúscula, minúscula, número y carácter especial',
  })
  password?: string;

  @ApiPropertyOptional({ example: 'nuevo_fcm_token_XYZ987' })
  @IsOptional()
  @IsString()
  @Length(10, 255)
  token_fcm?: string;
}
