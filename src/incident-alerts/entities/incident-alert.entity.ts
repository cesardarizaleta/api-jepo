import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ schema: 'asistencia_proactiva', name: 'alertas_incidentes' })
export class IncidentAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_usuario', type: 'int' })
  id_usuario: number;

  @ManyToOne(() => User, (user) => user.alertas, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: User;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitud: string;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitud: string;

  @Column({ name: 'url_audio_contexto', type: 'text' })
  url_audio_contexto: string;

  @Column({
    name: 'fecha_hora',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_hora: Date;

  @Column({ name: 'es_proactiva', type: 'boolean', default: false })
  es_proactiva: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
