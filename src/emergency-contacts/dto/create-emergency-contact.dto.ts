import { IsInt, IsString, Length, Max, Min } from 'class-validator';

export class CreateEmergencyContactDto {
  @IsString()
  @Length(2, 120)
  nombre_contacto: string;

  @IsString()
  @Length(7, 30)
  telefono_contacto: string;

  @IsInt()
  @Min(1)
  @Max(5)
  prioridad: number;
}
