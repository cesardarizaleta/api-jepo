import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderItemDto {
  @ApiProperty({ example: 10, description: 'ID del contacto de emergencia' })
  @IsInt()
  id!: number;

  @ApiProperty({
    example: 1,
    description: 'Nueva prioridad (posicion en la lista, empezando en 1)',
  })
  @IsInt()
  @Min(1)
  prioridad!: number;
}

export class ReorderContactsDto {
  @ApiProperty({
    type: [ReorderItemDto],
    description: 'Array con el nuevo orden de los contactos',
    example: [
      { id: 10, prioridad: 1 },
      { id: 15, prioridad: 2 },
      { id: 12, prioridad: 3 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  orden!: ReorderItemDto[];
}
