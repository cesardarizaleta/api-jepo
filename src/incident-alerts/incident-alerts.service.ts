import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyContact } from '../emergency-contacts/entities/emergency-contact.entity';
import { EmergencyContactVerificationStatus } from '../emergency-contacts/emergency-contact.enums';
import { User } from '../users/entities/user.entity';
import { AlertStatus } from './alert-status.enum';
import { CreateIncidentAlertDto } from './dto/create-incident-alert.dto';
import { HistorialQueryDto } from './dto/historial-query.dto';
import { RegisterFalsoPositivoDto } from './dto/register-falso-positivo.dto';
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

export type AlertMetricsResult = {
  totalAlertas: number;
  alertasReales: number;
  falsosPositivos: number;
  pendientes: number;
  tasaFalsosPositivos: number;
  tasaAlertasReales: number;
  promedioAlertasPorMes: number;
  ultimaAlerta: string | null;
  alertasPorMes: Array<{
    mes: string;
    total: number;
    reales: number;
    falsosPositivos: number;
  }>;
};

export type AlertHistorialResult = {
  data: IncidentAlert[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

@Injectable()
export class IncidentAlertsService {
  private readonly logger = new Logger(IncidentAlertsService.name);
  private static readonly SIN_AUDIO_URL = 'https://jepo.local/sin-audio';

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
    idUsuarioAutenticado: number,
    createAlertDto: CreateIncidentAlertDto,
  ): Promise<AlertCreateResult> {
    const user = await this.findUserOrFail(idUsuarioAutenticado);

    const alert = this.alertsRepository.create({
      ...createAlertDto,
      id_usuario: user.cedula,
      latitud: createAlertDto.latitud.toFixed(8),
      longitud: createAlertDto.longitud.toFixed(8),
      fecha_hora: createAlertDto.fecha_hora
        ? new Date(createAlertDto.fecha_hora)
        : new Date(),
      estado: AlertStatus.PENDIENTE,
    });

    const savedAlert = await this.alertsRepository.save(alert);

    let contactosNotificar: EmergencyContact[] = [];
    const notificaciones: AlertCreateResult['notificaciones'] = null;

    if (savedAlert.es_proactiva) {
      contactosNotificar = await this.contactsRepository.find({
        where: {
          id_usuario: savedAlert.id_usuario,
          estado_verificacion: EmergencyContactVerificationStatus.VERIFIED,
        },
        order: { prioridad: 'ASC', id: 'ASC' },
      });

      const resolvedAlert = await this.markAsReal(savedAlert);

      // Ejecutar envíos en background (no bloquear la petición)
      this.evolutionNotificationService
        .notifyEmergencyContacts(
          resolvedAlert,
          `${user.nombre} ${user.apellido}`.trim(),
          contactosNotificar,
          false,
          createAlertDto.audio_base64,
        )
        .then((detail) => {
          const sent = detail.filter((item) => item.success).length;
          this.logger.log(
            `Notificaciones enviadas: ${sent}/${detail.length} para alerta ${resolvedAlert.id}`,
          );
        })
        .catch((err) => {
          this.logger.error(
            'Error enviando notificaciones por Evolution API',
            err,
          );
        });

      return {
        alerta: resolvedAlert,
        contactosNotificar,
        notificaciones,
      };
    }

    return {
      alerta: savedAlert,
      contactosNotificar,
      notificaciones,
    };
  }

  async createManual(
    idUsuarioAutenticado: number,
    createAlertDto: CreateIncidentAlertDto,
  ): Promise<AlertCreateResult> {
    const user = await this.findUserOrFail(idUsuarioAutenticado);

    const alert = this.alertsRepository.create({
      ...createAlertDto,
      id_usuario: user.cedula,
      latitud: createAlertDto.latitud.toFixed(8),
      longitud: createAlertDto.longitud.toFixed(8),
      fecha_hora: createAlertDto.fecha_hora
        ? new Date(createAlertDto.fecha_hora)
        : new Date(),
      es_proactiva: false, // Forzar a false para asistencia manual
      estado: AlertStatus.PENDIENTE,
    });

    const savedAlert = await this.alertsRepository.save(alert);
    const resolvedAlert = await this.markAsReal(savedAlert);

    let contactosNotificar: EmergencyContact[] = [];
    const notificaciones: AlertCreateResult['notificaciones'] = null;

    contactosNotificar = await this.contactsRepository.find({
      where: { id_usuario: resolvedAlert.id_usuario },
      order: { prioridad: 'ASC', id: 'ASC' },
    });

    this.evolutionNotificationService
      .notifyEmergencyContacts(
        resolvedAlert,
        `${user.nombre} ${user.apellido}`.trim(),
        contactosNotificar,
        true,
        createAlertDto.audio_base64,
      )
      .then((detail) => {
        const sent = detail.filter((item) => item.success).length;
        this.logger.log(
          `Notificaciones manuales enviadas: ${sent}/${detail.length} para alerta ${resolvedAlert.id}`,
        );
      })
      .catch((err) => {
        this.logger.error(
          'Error enviando notificaciones manuales por Evolution API',
          err,
        );
      });

    return {
      alerta: resolvedAlert,
      contactosNotificar,
      notificaciones,
    };
  }

  async registerFalsoPositivo(
    idUsuarioAutenticado: number,
    dto: RegisterFalsoPositivoDto,
  ): Promise<IncidentAlert> {
    const user = await this.findUserOrFail(idUsuarioAutenticado);
    const now = new Date();

    const alert = this.alertsRepository.create({
      id_usuario: user.cedula,
      latitud: dto.latitud.toFixed(8),
      longitud: dto.longitud.toFixed(8),
      url_audio_contexto: IncidentAlertsService.SIN_AUDIO_URL,
      fecha_hora: dto.fecha_hora ? new Date(dto.fecha_hora) : now,
      es_proactiva: false,
      estado: AlertStatus.FALSO_POSITIVO,
      resuelta_en: now,
    });

    return this.alertsRepository.save(alert);
  }

  async findAllByUser(idUsuarioAutenticado: number): Promise<IncidentAlert[]> {
    const user = await this.findUserOrFail(idUsuarioAutenticado);
    return this.alertsRepository.find({
      where: { id_usuario: user.cedula },
      order: { fecha_hora: 'DESC' },
    });
  }

  async findOneByUser(
    idUsuarioAutenticado: number,
    id: number,
  ): Promise<IncidentAlert> {
    const user = await this.findUserOrFail(idUsuarioAutenticado);
    const alert = await this.alertsRepository.findOne({
      where: { id, id_usuario: user.cedula },
    });
    if (!alert) {
      throw new NotFoundException('Alerta no encontrada');
    }
    return alert;
  }

  async update(
    idUsuarioAutenticado: number,
    id: number,
    updateAlertDto: UpdateIncidentAlertDto,
  ): Promise<IncidentAlert> {
    const alert = await this.findOneByUser(idUsuarioAutenticado, id);

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

  async getHistorial(
    idUsuarioAutenticado: number,
    filtros: HistorialQueryDto,
  ): Promise<AlertHistorialResult> {
    const user = await this.findUserOrFail(idUsuarioAutenticado);
    return this.getHistorialForUser(user, filtros);
  }

  async getHistorialForUser(
    user: User,
    filtros: HistorialQueryDto,
  ): Promise<AlertHistorialResult> {
    const pagina = filtros.pagina ?? 1;
    const porPagina = filtros.porPagina ?? 20;

    const qb = this.alertsRepository
      .createQueryBuilder('alerta')
      .where('alerta.id_usuario = :cedula', { cedula: user.cedula });

    if (filtros.estado) {
      qb.andWhere('alerta.estado = :estado', { estado: filtros.estado });
    }
    if (filtros.desde) {
      qb.andWhere('alerta.fecha_hora >= :desde', {
        desde: new Date(filtros.desde),
      });
    }
    if (filtros.hasta) {
      qb.andWhere('alerta.fecha_hora <= :hasta', {
        hasta: new Date(filtros.hasta),
      });
    }

    const total = await qb.getCount();

    const data = await qb
      .orderBy('alerta.fecha_hora', 'DESC')
      .skip((pagina - 1) * porPagina)
      .take(porPagina)
      .getMany();

    return {
      data,
      total,
      pagina,
      porPagina,
      totalPaginas: total === 0 ? 0 : Math.ceil(total / porPagina),
    };
  }

  async getMetricas(idUsuarioAutenticado: number): Promise<AlertMetricsResult> {
    const user = await this.findUserOrFail(idUsuarioAutenticado);
    return this.getMetricasForUser(user);
  }

  async getMetricasForUser(user: User): Promise<AlertMetricsResult> {
    const cedula = user.cedula;

    const statusRows = await this.alertsRepository
      .createQueryBuilder('a')
      .select('a.estado', 'estado')
      .addSelect('COUNT(*)::int', 'count')
      .where('a.id_usuario = :cedula', { cedula })
      .groupBy('a.estado')
      .getRawMany<{ estado: AlertStatus; count: number }>();

    const countByStatus = (status: AlertStatus): number =>
      Number(
        statusRows.find((row) => row.estado === status)?.count ?? 0,
      );

    const alertasReales = countByStatus(AlertStatus.REAL);
    const falsosPositivos = countByStatus(AlertStatus.FALSO_POSITIVO);
    const pendientes = countByStatus(AlertStatus.PENDIENTE);
    const totalAlertas = alertasReales + falsosPositivos + pendientes;

    const clasificadas = alertasReales + falsosPositivos;
    const tasaFalsosPositivos =
      clasificadas > 0
        ? Math.round((falsosPositivos / clasificadas) * 1000) / 10
        : 0;
    const tasaAlertasReales =
      clasificadas > 0
        ? Math.round((alertasReales / clasificadas) * 1000) / 10
        : 0;

    const monthlyRows = await this.alertsRepository.query(
      `
      SELECT
        TO_CHAR(fecha_hora, 'YYYY-MM') AS mes,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = $2)::int AS reales,
        COUNT(*) FILTER (WHERE estado = $3)::int AS "falsosPositivos"
      FROM asistencia_proactiva.alertas_incidentes
      WHERE cedula_usuario = $1
        AND deleted_at IS NULL
      GROUP BY TO_CHAR(fecha_hora, 'YYYY-MM')
      ORDER BY mes ASC
      `,
      [cedula, AlertStatus.REAL, AlertStatus.FALSO_POSITIVO],
    );

    const alertasPorMes = monthlyRows.map(
      (row: {
        mes: string;
        total: number;
        reales: number;
        falsosPositivos: number;
      }) => ({
        mes: row.mes,
        total: Number(row.total),
        reales: Number(row.reales),
        falsosPositivos: Number(row.falsosPositivos),
      }),
    );

    const promedioAlertasPorMes =
      alertasPorMes.length > 0
        ? Math.round((totalAlertas / alertasPorMes.length) * 10) / 10
        : 0;

    const ultimaRow = await this.alertsRepository
      .createQueryBuilder('a')
      .select('MAX(a.fecha_hora)', 'ultima')
      .where('a.id_usuario = :cedula', { cedula })
      .getRawOne<{ ultima: Date | null }>();

    return {
      totalAlertas,
      alertasReales,
      falsosPositivos,
      pendientes,
      tasaFalsosPositivos,
      tasaAlertasReales,
      promedioAlertasPorMes,
      ultimaAlerta: ultimaRow?.ultima
        ? new Date(ultimaRow.ultima).toISOString()
        : null,
      alertasPorMes,
    };
  }

  async getFamilyMembers(userId: number): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'cedula', 'telefono'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.telefono) {
      return [];
    }

    return this.usersRepository
      .createQueryBuilder('u')
      .innerJoin(
        EmergencyContact,
        'ec',
        `u.deleted_at IS NULL AND ec.deleted_at IS NULL AND ec.estado_verificacion = :status AND (
          (ec.cedula_usuario = :cedula AND ec.telefono_contacto = u.telefono)
          OR
          (ec.cedula_usuario = u.cedula AND ec.telefono_contacto = :telefono)
        )`,
        {
          status: EmergencyContactVerificationStatus.VERIFIED,
          cedula: user.cedula,
          telefono: user.telefono,
        }
      )
      .select(['u.id', 'u.nombre', 'u.apellido', 'u.telefono', 'u.cedula'])
      .where('u.id != :userId', { userId })
      .orderBy('u.nombre', 'ASC')
      .getMany();
  }

  async isFamilyMember(userId: number, targetUserId: number): Promise<boolean> {
    if (userId === targetUserId) {
      return false;
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['cedula', 'telefono'],
    });
    const targetUser = await this.usersRepository.findOne({
      where: { id: targetUserId },
      select: ['cedula', 'telefono'],
    });

    if (!user || !targetUser || !user.telefono || !targetUser.telefono) {
      return false;
    }

    const contact = await this.contactsRepository.findOne({
      where: [
        {
          id_usuario: user.cedula,
          telefono_contacto: targetUser.telefono,
          estado_verificacion: EmergencyContactVerificationStatus.VERIFIED,
        },
        {
          id_usuario: targetUser.cedula,
          telefono_contacto: user.telefono,
          estado_verificacion: EmergencyContactVerificationStatus.VERIFIED,
        },
      ],
    });

    return !!contact;
  }

  private async markAsReal(alert: IncidentAlert): Promise<IncidentAlert> {
    alert.estado = AlertStatus.REAL;
    alert.resuelta_en = new Date();
    return this.alertsRepository.save(alert);
  }

  async remove(idUsuarioAutenticado: number, id: number): Promise<void> {
    const user = await this.findUserOrFail(idUsuarioAutenticado);
    await this.findOneByUser(idUsuarioAutenticado, id);
    await this.alertsRepository.softDelete({
      id,
      id_usuario: user.cedula,
    });
  }

  async reportSafe(
    idUsuarioAutenticado: number,
  ): Promise<{ message: string; count: number }> {
    const user = await this.findUserOrFail(idUsuarioAutenticado);
    const userFullName = `${user.nombre} ${user.apellido}`.trim();

    const contacts = await this.contactsRepository.find({
      where: {
        id_usuario: user.cedula,
        estado_verificacion: EmergencyContactVerificationStatus.VERIFIED,
      },
    });

    if (contacts.length === 0) {
      return {
        message: 'No tienes contactos de emergencia verificados para notificar',
        count: 0,
      };
    }

    const text = [
      '🛡️ *JEPO - Reporte de Seguridad*',
      '',
      `✅ *${userFullName}* se encuentra bien y en buenas condiciones. ¡Todo está excelente! 👍`,
    ].join('\n');

    void this.evolutionNotificationService
      .sendTextNotification(contacts, text)
      .catch((err) => {
        this.logger.error(
          `Error enviando reportSafe para el usuario ${user.id}`,
          err as Error,
        );
      });

    return {
      message: 'Reporte de seguridad enviado a tus contactos',
      count: contacts.length,
    };
  }

  async findUserOrFail(idUsuario: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: idUsuario },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }
}
