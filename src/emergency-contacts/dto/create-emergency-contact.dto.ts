import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmergencyContactDto {
  @ApiProperty({ example: 'Maria Perez', minLength: 2, maxLength: 120 })
  @IsString()
  @Length(2, 120)
  nombre_contacto: string;

  @ApiProperty({ example: '+56912345678', minLength: 7, maxLength: 30 })
  @IsString()
  @Length(7, 30)
  telefono_contacto: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  prioridad: number;
}
