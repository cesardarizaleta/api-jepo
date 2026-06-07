import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyContact } from '../emergency-contacts/entities/emergency-contact.entity';
import { EmergencyContactVerificationStatus } from '../emergency-contacts/emergency-contact.enums';
import { User } from '../users/entities/user.entity';

export type MonitoredUser = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  ultima_latitud: number | null;
  ultima_longitud: number | null;
  fecha_ultima_ubicacion: Date | null;
  tiene_alerta_activa: boolean;
  prioridad_en_su_lista: number;
};

/**
 * Ventana en minutos para considerar que una alerta es "activa" (reciente).
 */
const ACTIVE_ALERT_WINDOW_MINUTES = 30;

@Injectable()
export class FamilyMapService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(EmergencyContact)
    private readonly contactsRepository: Repository<EmergencyContact>,
  ) {}

  async getMonitoredUsers(viewerUserId: number): Promise<MonitoredUser[]> {
    const viewer = await this.usersRepository.findOne({
      where: { id: viewerUserId },
      select: ['id', 'telefono'],
    });
    if (!viewer) {
      throw new NotFoundException('Usuario autenticado no encontrado');
    }
    if (!viewer.telefono) {
      return [];
    }

    const activeSince = new Date(
      Date.now() - ACTIVE_ALERT_WINDOW_MINUTES * 60 * 1000,
    );

    /**
     * Grafo:
     *   contactos_emergencia.telefono_contacto == viewer.telefono
     *   AND estado_verificacion = 'VERIFIED'
     *   -> JOIN usuarios ON usuarios.cedula = contacto.cedula_usuario
     *   -> LEFT JOIN alertas recientes por usuario (para flag tiene_alerta_activa)
     *
     * Se usa QueryBuilder por eficiencia: una sola consulta con subquery para alertas.
     */
    const rows = await this.contactsRepository
      .createQueryBuilder('ec')
      .innerJoin(
        User,
        'u',
        'u.cedula = ec.cedula_usuario AND u.deleted_at IS NULL',
      )
      .leftJoin(
        (qb) =>
          qb
            .select('a.cedula_usuario', 'cedula_usuario')
            .addSelect('MAX(a.fecha_hora)', 'ultima_alerta')
            .from('asistencia_proactiva.alertas_incidentes', 'a')
            .where('a.deleted_at IS NULL')
            .andWhere('a.fecha_hora >= :activeSince', { activeSince })
            .groupBy('a.cedula_usuario'),
        'al',
        'al.cedula_usuario = u.cedula',
      )
      .select([
        'u.id AS id',
        'u.nombre AS nombre',
        'u.apellido AS apellido',
        'u.telefono AS telefono',
        'u.ultima_latitud AS ultima_latitud',
        'u.ultima_longitud AS ultima_longitud',
        'u.fecha_ultima_ubicacion AS fecha_ultima_ubicacion',
        'ec.prioridad AS prioridad_en_su_lista',
        'CASE WHEN al.ultima_alerta IS NOT NULL THEN TRUE ELSE FALSE END AS tiene_alerta_activa',
      ])
      .where('ec.telefono_contacto = :telefono', { telefono: viewer.telefono })
      .andWhere('ec.estado_verificacion = :status', {
        status: EmergencyContactVerificationStatus.VERIFIED,
      })
      .andWhere('ec.deleted_at IS NULL')
      .orderBy('tiene_alerta_activa', 'DESC')
      .addOrderBy('ec.prioridad', 'ASC')
      .addOrderBy('u.nombre', 'ASC')
      .getRawMany<{
        id: number;
        nombre: string;
        apellido: string;
        telefono: string;
        ultima_latitud: string | null;
        ultima_longitud: string | null;
        fecha_ultima_ubicacion: Date | null;
        prioridad_en_su_lista: number;
        tiene_alerta_activa: boolean;
      }>();

    return rows.map((r) => ({
      id: Number(r.id),
      nombre: r.nombre,
      apellido: r.apellido,
      telefono: r.telefono,
      ultima_latitud:
        r.ultima_latitud === null || r.ultima_latitud === undefined
          ? null
          : Number(r.ultima_latitud),
      ultima_longitud:
        r.ultima_longitud === null || r.ultima_longitud === undefined
          ? null
          : Number(r.ultima_longitud),
      fecha_ultima_ubicacion: r.fecha_ultima_ubicacion ?? null,
      tiene_alerta_activa: Boolean(r.tiene_alerta_activa),
      prioridad_en_su_lista: Number(r.prioridad_en_su_lista),
    }));
  }
}
