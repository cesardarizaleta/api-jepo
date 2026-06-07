import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmergencyContactDto {
  @ApiProperty({
    example: 'Juan Lopez',
    description: 'Nombre del contacto de emergencia',
    minLength: 2,
    maxLength: 120,
  })
  @IsString()
  @Length(2, 120)
  nombre_contacto!: string;

  @ApiProperty({
    example: '+584141234567',
    description: 'Telefono del contacto de emergencia en formato E.164',
    minLength: 7,
    maxLength: 30,
  })
  @IsString()
  @Length(7, 30)
  telefono_contacto!: string;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Prioridad del contacto (1-5). Si no se envia, se asigna automaticamente al final de la lista.',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  prioridad?: number;
}
