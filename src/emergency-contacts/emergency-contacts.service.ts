import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { EmergencyContact } from './entities/emergency-contact.entity';

@Injectable()
export class EmergencyContactsService {
  private static readonly MAX_CONTACTS = 5;

  constructor(
    @InjectRepository(EmergencyContact)
    private readonly contactsRepository: Repository<EmergencyContact>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    idUsuario: number,
    createContactDto: CreateEmergencyContactDto,
  ): Promise<EmergencyContact> {
    await this.ensureUserExists(idUsuario);
    await this.ensureMaxContactsRule(idUsuario);
    await this.ensureUniquePhone(idUsuario, createContactDto.telefono_contacto);

    const contact = this.contactsRepository.create({
      ...createContactDto,
      id_usuario: idUsuario,
    });

    return this.contactsRepository.save(contact);
  }

  async findAllByUser(idUsuario: number): Promise<EmergencyContact[]> {
    await this.ensureUserExists(idUsuario);
    return this.contactsRepository.find({
      where: { id_usuario: idUsuario },
      order: { prioridad: 'ASC', id: 'ASC' },
    });
  }

  async findOneByUser(
    idUsuario: number,
    id: number,
  ): Promise<EmergencyContact> {
    await this.ensureUserExists(idUsuario);
    const contact = await this.contactsRepository.findOne({
      where: { id, id_usuario: idUsuario },
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

    if (
      updateContactDto.telefono_contacto &&
      updateContactDto.telefono_contacto !== contact.telefono_contacto
    ) {
      await this.ensureUniquePhone(
        idUsuario,
        updateContactDto.telefono_contacto,
      );
    }

    const merged = this.contactsRepository.merge(contact, updateContactDto);
    return this.contactsRepository.save(merged);
  }

  async remove(idUsuario: number, id: number): Promise<void> {
    await this.findOneByUser(idUsuario, id);
    await this.contactsRepository.softDelete({ id, id_usuario: idUsuario });
  }

  private async ensureUserExists(idUsuario: number): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: idUsuario },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  private async ensureMaxContactsRule(idUsuario: number): Promise<void> {
    const totalContacts = await this.contactsRepository.count({
      where: { id_usuario: idUsuario },
    });
    if (totalContacts >= EmergencyContactsService.MAX_CONTACTS) {
      throw new BadRequestException(
        'El usuario ya tiene el maximo de 5 contactos de emergencia',
      );
    }
  }

  private async ensureUniquePhone(
    idUsuario: number,
    telefonoContacto: string,
  ): Promise<void> {
    const existing = await this.contactsRepository.findOne({
      where: { id_usuario: idUsuario, telefono_contacto: telefonoContacto },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un contacto con ese telefono para el usuario',
      );
    }
  }
}
