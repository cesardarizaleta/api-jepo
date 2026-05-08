import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncidentAlertDto {
  @ApiProperty({
    example: 10.50234567,
    description: 'Latitud con precision maxima de 8 decimales',
  })
  @IsNumber({ maxDecimalPlaces: 8 })
  latitud: number;

  @ApiProperty({
    example: -66.91234567,
    description: 'Longitud con precision maxima de 8 decimales',
  })
  @IsNumber({ maxDecimalPlaces: 8 })
  longitud: number;

  @ApiProperty({
    example: 'https://storage.jepo.com/audio/contexto-123.mp3',
    description: 'URL del audio de contexto capturado en el incidente',
  })
  @IsUrl({ require_protocol: true })
  url_audio_contexto: string;

  @ApiPropertyOptional({
    example: '2026-05-08T10:30:00.000Z',
    description: 'Fecha y hora ISO del incidente',
  })
  @IsOptional()
  @IsDateString()
  fecha_hora?: string;

  @ApiProperty({
    example: true,
    description: 'Indica si la alerta fue detectada de forma proactiva',
  })
  @IsBoolean()
  es_proactiva: boolean;
}
