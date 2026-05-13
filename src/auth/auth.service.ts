import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '../common/mailer/mailer.service';
import { EvolutionService } from '../common/evolution/evolution.service';
import { PasswordService } from '../common/security/password.service';
import { VerificationService } from '../common/verification/verification.service';
import {
  VerificationChannel,
  VerificationPurpose,
  VerificationSubjectType,
} from '../common/verification/verification.enums';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export type AuthContext = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private static readonly GENERIC_FORGOT_MESSAGE =
    'Si la cuenta existe, recibiras un codigo de verificacion';

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly verificationService: VerificationService,
    private readonly mailerService: MailerService,
    private readonly evolutionService: EvolutionService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    return this.buildAuthResponse(user.id, user.email, user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );
    if (!user?.password_hash) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isValidPassword = await this.passwordService.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const safeUser = await this.usersService.findOne(user.id);
    return this.buildAuthResponse(user.id, user.email, safeUser);
  }

  /**
   * Forgot password: responde genérico cuando el usuario no existe (anti-enumeración).
   * Cuando el usuario sí existe, espera al envío real:
   *  - éxito: 200 con mensaje genérico
   *  - fallo de proveedor (Gmail/Evolution): 500 (no cuelga la petición)
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
    context: AuthContext,
  ): Promise<{ message: string }> {
    const identifier = dto.email_or_phone.trim();
    const method = dto.method;

    const user = await this.findUserByEmailOrPhone(identifier);
    if (!user) {
      this.logger.debug(
        'forgot-password: identidad no encontrada (respuesta silenciosa)',
      );
      return { message: AuthService.GENERIC_FORGOT_MESSAGE };
    }

    const channel =
      method === 'whatsapp'
        ? VerificationChannel.WHATSAPP
        : VerificationChannel.EMAIL;
    const deliveryTarget =
      channel === VerificationChannel.EMAIL ? user.email : user.telefono;

    if (!deliveryTarget) {
      this.logger.warn(
        `Usuario ${user.id} no tiene canal ${channel} configurado`,
      );
      return { message: AuthService.GENERIC_FORGOT_MESSAGE };
    }

    const { plainCode } = await this.verificationService.issueCode({
      purpose: VerificationPurpose.PASSWORD_RESET,
      subjectType: VerificationSubjectType.USER,
      subjectId: user.id,
      channel,
      deliveryTarget,
      ttlMinutes: 15,
      maxAttempts: 3,
      resendCooldownSeconds: 60,
      maxActiveResends: 3,
      context,
    });

    try {
      if (channel === VerificationChannel.EMAIL) {
        await this.mailerService.sendPasswordResetOtp(
          deliveryTarget,
          plainCode,
        );
      } else {
        const text = [
          '🔐 *JEPO - Recuperacion de contraseña*',
          '',
          `Tu codigo de verificacion es: *${plainCode}*`,
          'Expira en 15 minutos.',
          '',
          'Si no solicitaste este cambio, ignora este mensaje.',
        ].join('\n');
        const result = await this.evolutionService.sendText(
          deliveryTarget,
          text,
        );
        if (!result.success) {
          throw new Error(result.error ?? 'Fallo envio WhatsApp');
        }
      }
    } catch (err) {
      this.logger.error(
        `forgot-password: fallo enviando OTP al usuario ${user.id}`,
        err as Error,
      );
      throw new InternalServerErrorException(
        'No fue posible entregar el codigo de verificacion. Intenta nuevamente en unos segundos.',
      );
    }

    return { message: AuthService.GENERIC_FORGOT_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.findUserByEmailOrPhone(dto.email_or_phone);
    if (!user) {
      // Respuesta uniforme: no revelar inexistencia
      throw new UnauthorizedException('Codigo invalido o expirado');
    }

    await this.verificationService.consumeCode({
      purpose: VerificationPurpose.PASSWORD_RESET,
      subjectType: VerificationSubjectType.USER,
      subjectId: user.id,
      plainCode: dto.otp,
    });

    const newHash = await this.passwordService.hash(dto.new_password);
    await this.usersRepository.update(
      { id: user.id },
      {
        password_hash: newHash,
        password_changed_at: new Date(),
      },
    );

    return { message: 'Contrasena actualizada correctamente' };
  }

  private async findUserByEmailOrPhone(
    identifier: string,
  ): Promise<User | null> {
    const normalized = identifier.trim();
    return this.usersRepository
      .createQueryBuilder('u')
      .where('u.email = :identifier', { identifier: normalized })
      .orWhere('u.telefono = :identifier', { identifier: normalized })
      .getOne();
  }

  private async buildAuthResponse(
    userId: number,
    userEmail: string,
    user: unknown,
  ) {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email: userEmail,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user,
    };
  }
}
