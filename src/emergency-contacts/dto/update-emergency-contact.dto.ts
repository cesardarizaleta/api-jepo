import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmergencyContactDto {
  @ApiPropertyOptional({ example: 'Carlos Romero' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  nombre_contacto?: string;

  @ApiPropertyOptional({ example: '+584121998877' })
  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono_contacto?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  prioridad?: number;
}
