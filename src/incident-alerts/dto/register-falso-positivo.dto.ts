import { IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterFalsoPositivoDto {
  @ApiProperty({ example: 10.50234567 })
  @IsNumber({ maxDecimalPlaces: 8 })
  latitud: number;

  @ApiProperty({ example: -66.91234567 })
  @IsNumber({ maxDecimalPlaces: 8 })
  longitud: number;

  @ApiPropertyOptional({ example: '2026-06-08T21:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  fecha_hora?: string;
}
