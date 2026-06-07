import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmergencyContact } from '../../emergency-contacts/entities/emergency-contact.entity';
import { IncidentAlert } from '../../incident-alerts/entities/incident-alert.entity';

@Entity({ schema: 'asistencia_proactiva', name: 'usuarios' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'bigint',
    unique: true,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number(value) : value),
    },
  })
  cedula: number;

  @Column({ type: 'varchar', length: 80 })
  nombre: string;

  @Column({ type: 'varchar', length: 80 })
  apellido: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  telefono: string;

  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  password_hash: string | null;

  @Column({
    name: 'password_changed_at',
    type: 'timestamptz',
    nullable: true,
  })
  password_changed_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token_fcm: string | null;

  @Column({
    name: 'ultima_latitud',
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null || value === undefined ? null : Number(value),
    },
  })
  ultima_latitud: number | null;

  @Column({
    name: 'ultima_longitud',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null || value === undefined ? null : Number(value),
    },
  })
  ultima_longitud: number | null;

  @Column({
    name: 'fecha_ultima_ubicacion',
    type: 'timestamptz',
    nullable: true,
  })
  fecha_ultima_ubicacion: Date | null;

  @OneToMany(() => EmergencyContact, (contact) => contact.usuario)
  contactos: EmergencyContact[];

  @OneToMany(() => IncidentAlert, (alert) => alert.usuario)
  alertas: IncidentAlert[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
