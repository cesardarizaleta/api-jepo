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
  @ApiProperty({ example: 1.2, description: 'Aceleración eje X (m/s²)' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 0.5, description: 'Aceleración eje Y (m/s²)' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 9.8, description: 'Aceleración eje Z (m/s²)' })
  @IsNumber()
  z: number;

  @ApiProperty({ example: 1716000000000, description: 'Timestamp en ms' })
  @IsNumber()
  timestamp: number;
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
    description: 'Array de lecturas del acelerómetro',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MuestraSensorDto)
  muestras: MuestraSensorDto[];
}
