import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'maria.perez@jepo.com',
    description: 'Email registrado o telefono en formato E.164',
    minLength: 5,
    maxLength: 120,
  })
  @IsString()
  @Length(5, 120)
  email_or_phone!: string;

  @ApiProperty({
    example: 'email',
    description: 'Canal por el que se entregara el codigo',
    enum: ['email', 'whatsapp'],
  })
  @IsIn(['email', 'whatsapp'])
  method!: 'email' | 'whatsapp';
}
