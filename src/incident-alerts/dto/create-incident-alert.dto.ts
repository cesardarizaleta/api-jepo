import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateIncidentAlertDto {
  @IsNumber({ maxDecimalPlaces: 8 })
  latitud: number;

  @IsNumber({ maxDecimalPlaces: 8 })
  longitud: number;

  @IsUrl({ require_protocol: true })
  url_audio_contexto: string;

  @IsOptional()
  @IsDateString()
  fecha_hora?: string;

  @IsBoolean()
  es_proactiva: boolean;
}
