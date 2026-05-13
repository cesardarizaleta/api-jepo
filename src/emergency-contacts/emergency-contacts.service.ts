import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { EvolutionService } from '../common/evolution/evolution.service';
import {
  VerificationChannel,
  VerificationPurpose,
  VerificationSubjectType,
} from '../common/verification/verification.enums';
import { VerificationService } from '../common/verification/verification.service';
import { User } from '../users/entities/user.entity';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { ReorderItemDto } from './dto/reorder-contacts.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { EmergencyContactVerificationStatus } from './emergency-contact.enums';
import { EmergencyContact } from './entities/emergency-contact.entity';

export type VerificationContext = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class EmergencyContactsService {
  private readonly logger = new Logger(EmergencyContactsService.name);
  private static readonly MAX_CONTACTS = 5;
  private static readonly OTP_TTL_MINUTES = 15;
  private static readonly OTP_MAX_ATTEMPTS = 3;
  private static readonly OTP_COOLDOWN_SECONDS = 60;
  private static readonly OTP_MAX_RESENDS = 3;

  constructor(
    @InjectRepository(EmergencyContact)
    private readonly contactsRepository: Repository<EmergencyContact>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly verificationService: VerificationService,
    private readonly evolutionService: EvolutionService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    idUsuario: number,
    createContactDto: CreateEmergencyContactDto,
    context: VerificationContext = {},
  ): Promise<EmergencyContact> {
    const user = await this.ensureUserExists(idUsuario);
    await this.ensureMaxContactsRule(user.cedula);
    await this.ensureUniquePhone(
      user.cedula,
      createContactDto.telefono_contacto,
    );

    // Auto-asignar prioridad si no se envía: MAX(prioridad) + 1
    let prioridad = createContactDto.prioridad;
    if (prioridad === undefined || prioridad === null) {
      const result = await this.contactsRepository
        .createQueryBuilder('c')
        .select('COALESCE(MAX(c.prioridad), 0)', 'maxPrioridad')
        .where('c.cedula_usuario = :cedula', { cedula: user.cedula })
        .andWhere('c.deleted_at IS NULL')
        .getRawOne<{ maxPrioridad: number }>();
      prioridad = (Number(result?.maxPrioridad) || 0) + 1;
    }

    const contact = this.contactsRepository.create({
      ...createContactDto,
      prioridad,
      id_usuario: user.cedula,
      estado_verificacion: EmergencyContactVerificationStatus.PENDING,
      accepted_at: null,
    });

    const saved = await this.contactsRepository.save(contact);

    // Emitir OTP y notificar al contacto (en background, no bloquear).
    void this.issueAndSendOtp(user, saved, context).catch((err) => {
      this.logger.error(
        `Fallo enviando OTP de verificacion al contacto ${saved.id}`,
        err as Error,
      );
    });

    return saved;
  }

  async resendVerification(
    idUsuario: number,
    contactId: number,
    context: VerificationContext = {},
  ): Promise<{ message: string }> {
    const user = await this.ensureUserExists(idUsuario);
    const contact = await this.findOneByUser(idUsuario, contactId);

    if (
      contact.estado_verificacion ===
      EmergencyContactVerificationStatus.VERIFIED
    ) {
      throw new BadRequestException('El contacto ya esta verificado');
    }

    await this.issueAndSendOtp(user, contact, context);
    return { message: 'Codigo de verificacion reenviado' };
  }

  async verify(
    idUsuario: number,
    contactId: number,
    codigo: string,
  ): Promise<EmergencyContact> {
    const contact = await this.findOneByUser(idUsuario, contactId);

    if (
      contact.estado_verificacion ===
      EmergencyContactVerificationStatus.VERIFIED
    ) {
      throw new BadRequestException('El contacto ya esta verificado');
    }

    await this.verificationService.consumeCode({
      purpose: VerificationPurpose.CONTACT_VERIFICATION,
      subjectType: VerificationSubjectType.EMERGENCY_CONTACT,
      subjectId: contact.id,
      plainCode: codigo,
    });

    contact.estado_verificacion = EmergencyContactVerificationStatus.VERIFIED;
    contact.accepted_at = new Date();
    return this.contactsRepository.save(contact);
  }

  async findAllByUser(idUsuario: number): Promise<EmergencyContact[]> {
    const user = await this.ensureUserExists(idUsuario);
    return this.contactsRepository.find({
      where: { id_usuario: user.cedula },
      order: { prioridad: 'ASC', id: 'ASC' },
    });
  }

  async findOneByUser(
    idUsuario: number,
    id: number,
  ): Promise<EmergencyContact> {
    const user = await this.ensureUserExists(idUsuario);
    const contact = await this.contactsRepository.findOne({
      where: { id, id_usuario: user.cedula },
    });

    if (!contact) {
      throw new NotFoundException('Contacto de emergencia no encontrado');
    }

    return contact;
  }

  async update(
    idUsuario: number,
    id: number,
    updateContactDto: UpdateEmergencyContactDto,
  ): Promise<EmergencyContact> {
    const contact = await this.findOneByUser(idUsuario, id);

    let phoneChanged = false;
    if (
      updateContactDto.telefono_contacto &&
      updateContactDto.telefono_contacto !== contact.telefono_contacto
    ) {
      await this.ensureUniquePhone(
        contact.id_usuario,
        updateContactDto.telefono_contacto,
      );
      phoneChanged = true;
    }

    const merged = this.contactsRepository.merge(contact, updateContactDto);

    // Si cambió el teléfono, invalidar verificación previa.
    if (phoneChanged) {
      merged.estado_verificacion = EmergencyContactVerificationStatus.PENDING;
      merged.accepted_at = null;
    }

    return this.contactsRepository.save(merged);
  }

  async remove(idUsuario: number, id: number): Promise<void> {
    const user = await this.ensureUserExists(idUsuario);
    await this.findOneByUser(idUsuario, id);
    await this.contactsRepository.softDelete({ id, id_usuario: user.cedula });
  }

  /**
   * Reordena masivamente los contactos del usuario.
   * Valida que todos los IDs pertenezcan al usuario autenticado.
   * Ejecuta en transacción para consistencia.
   */
  async reorder(
    idUsuario: number,
    items: ReorderItemDto[],
  ): Promise<EmergencyContact[]> {
    const user = await this.ensureUserExists(idUsuario);
    const ids = items.map((item) => item.id);

    // Verificar que todos los IDs pertenecen al usuario
    const contacts = await this.contactsRepository.find({
      where: { id: In(ids), id_usuario: user.cedula },
    });

    if (contacts.length !== ids.length) {
      const foundIds = new Set(contacts.map((c) => c.id));
      const invalidIds = ids.filter((id) => !foundIds.has(id));
      throw new ForbiddenException(
        `Los siguientes contactos no pertenecen al usuario o no existen: [${invalidIds.join(', ')}]`,
      );
    }

    // Ejecutar updates en transacción
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(EmergencyContact);
      const updates = items.map((item) =>
        repo.update(
          { id: item.id, id_usuario: user.cedula },
          { prioridad: item.prioridad },
        ),
      );
      await Promise.all(updates);
    });

    // Retornar la lista actualizada y ordenada
    return this.findAllByUser(idUsuario);
  }

  private async issueAndSendOtp(
    user: User,
    contact: EmergencyContact,
    context: VerificationContext,
  ): Promise<void> {
    const { plainCode } = await this.verificationService.issueCode({
      purpose: VerificationPurpose.CONTACT_VERIFICATION,
      subjectType: VerificationSubjectType.EMERGENCY_CONTACT,
      subjectId: contact.id,
      channel: VerificationChannel.WHATSAPP,
      deliveryTarget: contact.telefono_contacto,
      ttlMinutes: EmergencyContactsService.OTP_TTL_MINUTES,
      maxAttempts: EmergencyContactsService.OTP_MAX_ATTEMPTS,
      resendCooldownSeconds: EmergencyContactsService.OTP_COOLDOWN_SECONDS,
      maxActiveResends: EmergencyContactsService.OTP_MAX_RESENDS,
      context,
    });

    const userFullName = `${user.nombre} ${user.apellido}`.trim();
    const text = [
      '🛡️ *JEPO - Confirmacion de contacto de emergencia*',
      '',
      `*${userFullName}* te ha seleccionado como contacto de emergencia.`,
      'Si aceptas, comparte con esa persona el siguiente codigo para confirmar:',
      '',
      `🔑 Codigo: *${plainCode}*`,
      `Expira en ${EmergencyContactsService.OTP_TTL_MINUTES} minutos.`,
      '',
      'Si no deseas ser su contacto de emergencia, ignora este mensaje.',
    ].join('\n');

    const result = await this.evolutionService.sendText(
      contact.telefono_contacto,
      text,
    );
    if (!result.success) {
      this.logger.warn(
        `No se pudo entregar OTP de verificacion al contacto ${contact.id}: ${result.error}`,
      );
    }
  }

  private async ensureUserExists(idUsuario: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: idUsuario },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  private async ensureMaxContactsRule(cedula: number): Promise<void> {
    const totalContacts = await this.contactsRepository.count({
      where: { id_usuario: cedula },
    });
    if (totalContacts >= EmergencyContactsService.MAX_CONTACTS) {
      throw new BadRequestException(
        `El usuario ya tiene el maximo de ${EmergencyContactsService.MAX_CONTACTS} contactos de emergencia`,
      );
    }
  }

  private async ensureUniquePhone(
    cedula: number,
    telefonoContacto: string,
  ): Promise<void> {
    const existing = await this.contactsRepository.findOne({
      where: { id_usuario: cedula, telefono_contacto: telefonoContacto },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un contacto con ese telefono para el usuario',
      );
    }
  }
}
