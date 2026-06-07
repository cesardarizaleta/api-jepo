import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  VerificationChannel,
  VerificationPurpose,
  VerificationSubjectType,
} from '../verification.enums';

@Entity({ schema: 'asistencia_proactiva', name: 'verification_codes' })
@Index(['purpose', 'subject_type', 'subject_id', 'consumed_at'])
export class VerificationCode {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 40 })
  purpose: VerificationPurpose;

  @Column({ type: 'varchar', length: 40 })
  subject_type: VerificationSubjectType;

  @Column({ type: 'bigint' })
  subject_id: string;

  @Column({ type: 'varchar', length: 128 })
  code_hash: string;

  @Column({ type: 'varchar', length: 20 })
  delivery_channel: VerificationChannel;

  @Column({ type: 'varchar', length: 160 })
  delivery_target: string;

  @Column({ type: 'smallint', default: 0 })
  attempts: number;

  @Column({ type: 'smallint', default: 3 })
  max_attempts: number;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumed_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  invalidated_at: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip_requester: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
