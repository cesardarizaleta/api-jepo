import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateEmergencyContactDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  nombre_contacto?: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  telefono_contacto?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  prioridad?: number;
}
