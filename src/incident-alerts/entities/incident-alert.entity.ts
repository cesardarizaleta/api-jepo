import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AlertStatus } from '../alert-status.enum';

@Entity({ schema: 'asistencia_proactiva', name: 'alertas_incidentes' })
export class IncidentAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    name: 'cedula_usuario',
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number(value) : value),
    },
  })
  id_usuario: number;

  @ManyToOne(() => User, (user) => user.alertas, { nullable: true })
  @JoinColumn({ name: 'cedula_usuario', referencedColumnName: 'cedula' })
  usuario: User;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitud: string;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitud: string;

  @Column({ name: 'url_audio_contexto', type: 'text' })
  url_audio_contexto: string;

  @Index()
  @Column({
    name: 'fecha_hora',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_hora: Date;

  @Column({ name: 'es_proactiva', type: 'boolean', default: false })
  es_proactiva: boolean;

  @Index()
  @Column({
    type: 'varchar',
    length: 20,
    default: AlertStatus.PENDIENTE,
  })
  estado: AlertStatus;

  @Column({ name: 'resuelta_en', type: 'timestamptz', nullable: true })
  resuelta_en: Date | null;

  @Column({ name: 'notas_resolucion', type: 'text', nullable: true })
  notas_resolucion: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
