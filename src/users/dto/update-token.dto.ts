import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTokenDto {
  @ApiProperty({
    example: 'fcm_device_token_abc123456789',
    minLength: 10,
    maxLength: 255,
  })
  @IsString()
  @Length(10, 255)
  token_fcm: string;
}
