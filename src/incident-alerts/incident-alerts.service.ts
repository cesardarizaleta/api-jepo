import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyContact } from '../emergency-contacts/entities/emergency-contact.entity';
import { User } from '../users/entities/user.entity';
import { CreateIncidentAlertDto } from './dto/create-incident-alert.dto';
import { UpdateIncidentAlertDto } from './dto/update-incident-alert.dto';
import { IncidentAlert } from './entities/incident-alert.entity';
import {
  EvolutionNotificationService,
  EvolutionSendResult,
} from './services/evolution-notification.service';

type AlertCreateResult = {
  alerta: IncidentAlert;
  contactosNotificar: EmergencyContact[];
  notificaciones: {
    total: number;
    enviadas: number;
    fallidas: number;
    detalle: EvolutionSendResult[];
  } | null;
};

@Injectable()
export class IncidentAlertsService {
  private readonly logger = new Logger(IncidentAlertsService.name);
  constructor(
    @InjectRepository(IncidentAlert)
    private readonly alertsRepository: Repository<IncidentAlert>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(EmergencyContact)
    private readonly contactsRepository: Repository<EmergencyContact>,
    private readonly evolutionNotificationService: EvolutionNotificationService,
  ) {}

  async create(
    createAlertDto: CreateIncidentAlertDto,
  ): Promise<AlertCreateResult> {
    const user = await this.findUserOrFail(createAlertDto.id_usuario);

    const alert = this.alertsRepository.create({
      ...createAlertDto,
      latitud: createAlertDto.latitud.toFixed(8),
      longitud: createAlertDto.longitud.toFixed(8),
      fecha_hora: createAlertDto.fecha_hora
        ? new Date(createAlertDto.fecha_hora)
        : new Date(),
    });

    const savedAlert = await this.alertsRepository.save(alert);

    let contactosNotificar: EmergencyContact[] = [];
    let notificaciones: AlertCreateResult['notificaciones'] = null;

    if (savedAlert.es_proactiva) {
      contactosNotificar = await this.contactsRepository.find({
        where: { id_usuario: savedAlert.id_usuario },
        order: { prioridad: 'ASC', id: 'ASC' },
      });

      // Ejecutar envíos en background (no bloquear la petición)
      this.evolutionNotificationService
        .notifyEmergencyContacts(
          savedAlert,
          `${user.nombre} ${user.apellido}`.trim(),
          contactosNotificar,
        )
        .then((detail) => {
          const sent = detail.filter((item) => item.success).length;
          this.logger.log(
            `Notificaciones enviadas: ${sent}/${detail.length} para alerta ${savedAlert.id}`,
          );
          // Opcional: persistir `detail` en BD para auditoría.
        })
        .catch((err) => {
          this.logger.error('Error enviando notificaciones por Evolution API', err as any);
        });
    }

    return {
      alerta: savedAlert,
      contactosNotificar,
      notificaciones,
    };
  }

  findAll(): Promise<IncidentAlert[]> {
    return this.alertsRepository.find({ order: { fecha_hora: 'DESC' } });
  }

  async findOne(id: number): Promise<IncidentAlert> {
    const alert = await this.alertsRepository.findOne({ where: { id } });
    if (!alert) {
      throw new NotFoundException('Alerta no encontrada');
    }
    return alert;
  }

  async update(
    id: number,
    updateAlertDto: UpdateIncidentAlertDto,
  ): Promise<IncidentAlert> {
    const alert = await this.findOne(id);

    if (updateAlertDto.id_usuario) {
      await this.ensureUserExists(updateAlertDto.id_usuario);
    }

    const merged = this.alertsRepository.merge(alert, {
      ...updateAlertDto,
      latitud:
        updateAlertDto.latitud !== undefined
          ? updateAlertDto.latitud.toFixed(8)
          : alert.latitud,
      longitud:
        updateAlertDto.longitud !== undefined
          ? updateAlertDto.longitud.toFixed(8)
          : alert.longitud,
      fecha_hora: updateAlertDto.fecha_hora
        ? new Date(updateAlertDto.fecha_hora)
        : alert.fecha_hora,
    });

    return this.alertsRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.alertsRepository.softDelete(id);
  }

  private async ensureUserExists(idUsuario: number): Promise<void> {
    await this.findUserOrFail(idUsuario);
  }

  private async findUserOrFail(idUsuario: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: idUsuario },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }
}
