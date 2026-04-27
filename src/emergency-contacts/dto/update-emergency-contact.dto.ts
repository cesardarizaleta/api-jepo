import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmergencyContactDto {
  @ApiPropertyOptional({ example: 'Maria Perez', minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  nombre_contacto?: string;

  @ApiPropertyOptional({
    example: '+56912345678',
    minLength: 7,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono_contacto?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  prioridad?: number;
}
