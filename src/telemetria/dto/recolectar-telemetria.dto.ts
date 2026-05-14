import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class MuestraSensorDto {
  @ApiProperty({ example: 1778787715004, description: 'Timestamp en ms' })
  @IsNumber()
  t: number;

  @ApiProperty({ example: 0.12, description: 'Acelerómetro eje X (m/s²)' })
  @IsNumber()
  ax: number;

  @ApiProperty({ example: -0.34, description: 'Acelerómetro eje Y (m/s²)' })
  @IsNumber()
  ay: number;

  @ApiProperty({ example: 9.7, description: 'Acelerómetro eje Z (m/s²)' })
  @IsNumber()
  az: number;

  @ApiProperty({ example: 0.01, description: 'Giroscopio eje X (rad/s)' })
  @IsNumber()
  gx: number;

  @ApiProperty({ example: 0.02, description: 'Giroscopio eje Y (rad/s)' })
  @IsNumber()
  gy: number;

  @ApiProperty({ example: 0.0, description: 'Giroscopio eje Z (rad/s)' })
  @IsNumber()
  gz: number;
}

export class RecolectarTelemetriaDto {
  @ApiProperty({
    example: 'CAIDA',
    description: 'Etiqueta libre de la actividad registrada',
  })
  @IsString()
  @IsNotEmpty()
  etiqueta: string;

  @ApiProperty({
    type: [MuestraSensorDto],
    description: 'Array de lecturas de acelerómetro + giroscopio',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MuestraSensorDto)
  muestras: MuestraSensorDto[];
}
