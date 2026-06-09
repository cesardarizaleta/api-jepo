import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertStatus } from '../alert-status.enum';

export class ResolveAlertDto {
  @ApiProperty({
    enum: [AlertStatus.REAL, AlertStatus.FALSO_POSITIVO],
    example: AlertStatus.REAL,
  })
  @IsIn([AlertStatus.REAL, AlertStatus.FALSO_POSITIVO])
  estado: AlertStatus.REAL | AlertStatus.FALSO_POSITIVO;

  @ApiPropertyOptional({ example: 'Falsa alarma por bache en la vía' })
  @IsOptional()
  @IsString()
  notas_resolucion?: string;
}
