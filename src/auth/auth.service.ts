import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
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
   * Forgot password: responde genérico SIEMPRE (anti-enumeración).
   * Dispara el envío del OTP en background; no bloquea la respuesta.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
    context: AuthContext,
  ): Promise<{ message: string }> {
    const identifier = dto.email_or_phone.trim();
    const method = dto.method;

    void this.processForgotPassword(identifier, method, context).catch(
      (err) => {
        this.logger.error('Error en forgot-password (background)', err);
      },
    );

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

  private async processForgotPassword(
    identifier: string,
    method: 'email' | 'whatsapp',
    context: AuthContext,
  ): Promise<void> {
    const user = await this.findUserByEmailOrPhone(identifier);
    if (!user) {
      this.logger.debug(
        'forgot-password: identidad no encontrada (respuesta silenciosa)',
      );
      return;
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
      return;
    }

    try {
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

      if (channel === VerificationChannel.EMAIL) {
        await this.mailerService.sendMail({
          to: deliveryTarget,
          subject: 'Recuperacion de contrasena - JEPO',
          text: `Tu codigo de verificacion es: ${plainCode}\nExpira en 15 minutos. Si no solicitaste este cambio, ignora este mensaje.`,
        });
      } else {
        const text = [
          '🔐 *JEPO - Recuperacion de contrasena*',
          '',
          `Tu codigo de verificacion es: *${plainCode}*`,
          'Expira en 15 minutos.',
          '',
          'Si no solicitaste este cambio, ignora este mensaje.',
        ].join('\n');
        await this.evolutionService.sendText(deliveryTarget, text);
      }
    } catch (err) {
      this.logger.error(
        `forgot-password: fallo emitiendo/enviando OTP al usuario ${user.id}`,
        err as Error,
      );
    }
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
