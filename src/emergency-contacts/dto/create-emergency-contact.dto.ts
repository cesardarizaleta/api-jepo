import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmergencyContactDto {
  @ApiProperty({
    example: 'Juan Lopez',
    description: 'Nombre del contacto de emergencia',
  })
  @IsString()
  @Length(2, 120)
  nombre_contacto: string;

  @ApiProperty({
    example: '+584141234567',
    description: 'Telefono del contacto de emergencia',
  })
  @IsString()
  @Length(7, 30)
  telefono_contacto: string;

  @ApiProperty({
    example: 1,
    description: 'Prioridad del contacto entre 1 y 5',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  prioridad: number;
}
