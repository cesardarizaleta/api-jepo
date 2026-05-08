import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIncidentAlertDto {
  @ApiPropertyOptional({
    example: 10.50000001,
    description: 'Latitud con precision maxima de 8 decimales',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  latitud?: number;

  @ApiPropertyOptional({
    example: -66.90000001,
    description: 'Longitud con precision maxima de 8 decimales',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  longitud?: number;

  @ApiPropertyOptional({
    example: 'https://storage.jepo.com/audio/contexto-actualizado.mp3',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  url_audio_contexto?: string;

  @ApiPropertyOptional({
    example: '2026-05-08T11:05:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fecha_hora?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  es_proactiva?: boolean;
}
