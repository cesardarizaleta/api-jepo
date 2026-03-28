import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateIncidentAlertDto {
  @IsInt()
  id_usuario: number;

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
