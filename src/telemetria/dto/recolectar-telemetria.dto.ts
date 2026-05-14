import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';

export enum EtiquetaHAR {
  CAIDA = 'CAIDA',
  CAMINAR = 'CAMINAR',
  CORRER = 'CORRER',
  QUIETO = 'QUIETO',
  SUBIR_ESCALERAS = 'SUBIR_ESCALERAS',
  BAJAR_ESCALERAS = 'BAJAR_ESCALERAS',
}

export class MuestraSensorDto {
  @ApiProperty({ example: 1716000000000, description: 'Timestamp en ms' })
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
    enum: EtiquetaHAR,
    example: EtiquetaHAR.CAIDA,
    description: 'Etiqueta de la actividad registrada',
  })
  @IsEnum(EtiquetaHAR)
  etiqueta: EtiquetaHAR;

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
