import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTokenDto {
  @ApiProperty({
    example: 'fcm_token_movil_usuario_001',
    description: 'Token FCM actualizado del dispositivo',
  })
  @IsString()
  @Length(10, 255)
  token_fcm: string;
}
