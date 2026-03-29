import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class UpdateIncidentAlertDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  latitud?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  longitud?: number;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  url_audio_contexto?: string;

  @IsOptional()
  @IsDateString()
  fecha_hora?: string;

  @IsOptional()
  @IsBoolean()
  es_proactiva?: boolean;
}
