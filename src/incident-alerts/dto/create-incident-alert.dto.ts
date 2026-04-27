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
    example: -33.43719212,
    description: 'Latitud con precision maxima de 8 decimales',
  })
  @IsNumber({ maxDecimalPlaces: 8 })
  latitud: number;

  @ApiProperty({
    example: -70.65058345,
    description: 'Longitud con precision maxima de 8 decimales',
  })
  @IsNumber({ maxDecimalPlaces: 8 })
  longitud: number;

  @ApiProperty({
    example: 'https://storage.ejemplo.com/audio/contexto-123.mp3',
    format: 'uri',
  })
  @IsUrl({ require_protocol: true })
  url_audio_contexto: string;

  @ApiPropertyOptional({
    example: '2026-04-26T12:30:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fecha_hora?: string;

  @ApiProperty({
    example: true,
    description: 'Si es true, se obtienen contactos para protocolo de aviso',
  })
  @IsBoolean()
  es_proactiva: boolean;
}
