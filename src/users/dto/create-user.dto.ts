import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsCedula } from '../../common/validators/cedula.validator';
import { normalizeCedula } from '../../common/utils/cedula.util';

export class CreateUserDto {
  @IsCedula({ message: 'Cédula inválida' })
  @Transform(({ value }) => {
    const n = normalizeCedula(value);
    return n === null ? null : Number(n);
  }, { toClassOnly: true })
  cedula: number;
  @IsString()
  @Length(2, 80)
  nombre: string;

  @IsString()
  @Length(2, 80)
  apellido: string;

  @IsEmail()
  @Length(5, 120)
  email: string;

  @IsString()
  @Length(7, 30)
  telefono: string;

  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'La contraseña debe incluir mayúscula, minúscula, número y carácter especial',
  })
  password: string;

  @IsOptional()
  @IsString()
  @Length(10, 255)
  token_fcm?: string;
}
