import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { VerificationCode } from './entities/verification-code.entity';
import {
  VerificationChannel,
  VerificationPurpose,
  VerificationSubjectType,
} from './verification.enums';

export type VerificationContext = {
  ip?: string | null;
  userAgent?: string | null;
};

export type IssueCodeParams = {
  purpose: VerificationPurpose;
  subjectType: VerificationSubjectType;
  subjectId: number | string;
  channel: VerificationChannel;
  deliveryTarget: string;
  ttlMinutes?: number;
  maxAttempts?: number;
  resendCooldownSeconds?: number;
  maxActiveResends?: number;
  context?: VerificationContext;
};

export type IssueCodeResult = {
  challenge: VerificationCode;
  /** OTP en texto plano. Solo devuelto al flujo que va a enviarlo por el canal. */
  plainCode: string;
};

export type ConsumeCodeParams = {
  purpose: VerificationPurpose;
  subjectType: VerificationSubjectType;
  subjectId: number | string;
  plainCode: string;
};

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly pepper: string;

  constructor(
    @InjectRepository(VerificationCode)
    private readonly repository: Repository<VerificationCode>,
    private readonly configService: ConfigService,
  ) {
    this.pepper = this.configService.get<string>('PASSWORD_PEPPER', '');
  }

  async issueCode(params: IssueCodeParams): Promise<IssueCodeResult> {
    const {
      purpose,
      subjectType,
      subjectId,
      channel,
      deliveryTarget,
      ttlMinutes = 15,
      maxAttempts = 3,
      resendCooldownSeconds = 60,
      maxActiveResends = 3,
      context,
    } = params;

    const subjectIdStr = String(subjectId);
    const now = new Date();

    // Enforce cooldown y max de emisiones activas
    const activeCodes = await this.repository.find({
      where: {
        purpose,
        subject_type: subjectType,
        subject_id: subjectIdStr,
        consumed_at: IsNull(),
        invalidated_at: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });

    if (activeCodes.length > 0) {
      const latest = activeCodes[0];
      const secondsSinceLast = Math.floor(
        (now.getTime() - new Date(latest.createdAt).getTime()) / 1000,
      );
      if (secondsSinceLast < resendCooldownSeconds) {
        throw new BadRequestException(
          `Debes esperar ${resendCooldownSeconds - secondsSinceLast} segundos antes de solicitar un nuevo codigo`,
        );
      }
      if (activeCodes.length >= maxActiveResends) {
        throw new BadRequestException(
          `Se alcanzo el maximo de ${maxActiveResends} envios activos para este codigo`,
        );
      }
    }

    // Invalidar challenges previos activos
    await this.repository.update(
      {
        purpose,
        subject_type: subjectType,
        subject_id: subjectIdStr,
        consumed_at: IsNull(),
        invalidated_at: IsNull(),
      },
      { invalidated_at: now },
    );

    const plainCode = this.generateNumericCode(6);
    const codeHash = this.hashCode(plainCode, purpose, subjectIdStr);
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const entity = this.repository.create({
      purpose,
      subject_type: subjectType,
      subject_id: subjectIdStr,
      code_hash: codeHash,
      delivery_channel: channel,
      delivery_target: deliveryTarget,
      attempts: 0,
      max_attempts: maxAttempts,
      expires_at: expiresAt,
      consumed_at: null,
      invalidated_at: null,
      ip_requester: context?.ip ?? null,
      user_agent: context?.userAgent ?? null,
    });

    const challenge = await this.repository.save(entity);
    return { challenge, plainCode };
  }

  /**
   * Valida y consume el OTP activo más reciente para el subject/purpose.
   * En fallo, incrementa attempts e invalida si se supera el máximo.
   */
  async consumeCode(params: ConsumeCodeParams): Promise<VerificationCode> {
    const { purpose, subjectType, subjectId, plainCode } = params;
    const subjectIdStr = String(subjectId);
    const now = new Date();

    const challenge = await this.repository.findOne({
      where: {
        purpose,
        subject_type: subjectType,
        subject_id: subjectIdStr,
        consumed_at: IsNull(),
        invalidated_at: IsNull(),
        expires_at: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });

    if (!challenge) {
      throw new UnauthorizedException('Codigo invalido o expirado');
    }

    if (challenge.attempts >= challenge.max_attempts) {
      challenge.invalidated_at = now;
      await this.repository.save(challenge);
      throw new UnauthorizedException(
        'Se alcanzo el maximo de intentos para este codigo',
      );
    }

    const expectedHash = this.hashCode(plainCode, purpose, subjectIdStr);
    const storedBuffer = Buffer.from(challenge.code_hash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    const matches =
      storedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(storedBuffer, expectedBuffer);

    if (!matches) {
      challenge.attempts += 1;
      if (challenge.attempts >= challenge.max_attempts) {
        challenge.invalidated_at = now;
      }
      await this.repository.save(challenge);
      throw new UnauthorizedException('Codigo invalido o expirado');
    }

    challenge.consumed_at = now;
    return this.repository.save(challenge);
  }

  async purgeExpired(olderThanDays = 7): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('expires_at <= :cutoff', { cutoff })
      .execute();
    return result.affected ?? 0;
  }

  private generateNumericCode(digits: number): string {
    const max = 10 ** digits;
    const value = randomInt(0, max);
    return value.toString().padStart(digits, '0');
  }

  private hashCode(
    plainCode: string,
    purpose: VerificationPurpose,
    subjectId: string,
  ): string {
    // HMAC-SHA256 con pepper del servidor y binding al (purpose, subject)
    // para evitar replay entre flujos o entre sujetos.
    return createHmac('sha256', this.pepper)
      .update(`${purpose}:${subjectId}:${plainCode}`)
      .digest('hex');
  }
}
