import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyEmergencyContactDto {
  @ApiProperty({
    example: '123456',
    description: 'Codigo OTP recibido por el contacto vía WhatsApp',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]{6}$/, {
    message: 'codigo debe contener 6 digitos numericos',
  })
  codigo!: string;
}
