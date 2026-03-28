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

@Entity({ schema: 'asistencia_proactiva', name: 'contactos_emergencia' })
export class EmergencyContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_usuario', type: 'int' })
  id_usuario: number;

  @ManyToOne(() => User, (user) => user.contactos, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: User;

  @Column({ type: 'varchar', length: 120 })
  nombre_contacto: string;

  @Column({ type: 'varchar', length: 30 })
  telefono_contacto: string;

  @Column({ type: 'int' })
  prioridad: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
