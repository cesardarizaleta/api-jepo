import { IsString, Length } from 'class-validator';

export class UpdateTokenDto {
  @IsString()
  @Length(10, 255)
  token_fcm: string;
}
