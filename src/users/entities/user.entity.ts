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

  @Column({ type: 'varchar', length: 80 })
  nombre: string;

  @Column({ type: 'varchar', length: 80 })
  apellido: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 30 })
  telefono: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token_fcm: string | null;

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
