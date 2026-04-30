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

  @Column({
    name: 'cedula_usuario',
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number(value) : value),
    },
  })
  id_usuario: number;

  @ManyToOne(() => User, (user) => user.contactos, { nullable: false })
  @JoinColumn({ name: 'cedula_usuario', referencedColumnName: 'cedula' })
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
