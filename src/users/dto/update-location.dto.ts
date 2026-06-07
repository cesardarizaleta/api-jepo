import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({
    example: 10.50234567,
    description: 'Latitud en grados decimales (-90 a 90)',
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-90)
  @Max(90)
  latitud!: number;

  @ApiProperty({
    example: -66.91234567,
    description: 'Longitud en grados decimales (-180 a 180)',
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-180)
  @Max(180)
  longitud!: number;
}
