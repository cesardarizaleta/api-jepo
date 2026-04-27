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
    example: -33.43719212,
    description: 'Latitud con precision maxima de 8 decimales',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  latitud?: number;

  @ApiPropertyOptional({
    example: -70.65058345,
    description: 'Longitud con precision maxima de 8 decimales',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  longitud?: number;

  @ApiPropertyOptional({
    example: 'https://storage.ejemplo.com/audio/contexto-123.mp3',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  url_audio_contexto?: string;

  @ApiPropertyOptional({
    example: '2026-04-26T12:30:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fecha_hora?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  es_proactiva?: boolean;
}
