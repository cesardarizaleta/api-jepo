import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlertResolutionStatus1778700000000 implements MigrationInterface {
  name = 'AlertResolutionStatus1778700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET search_path TO asistencia_proactiva;`);

    await queryRunner.query(`
      ALTER TABLE alertas_incidentes
        ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE';
    `);
    await queryRunner.query(`
      ALTER TABLE alertas_incidentes
        ADD COLUMN IF NOT EXISTS resuelta_en TIMESTAMPTZ NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE alertas_incidentes
        ADD COLUMN IF NOT EXISTS notas_resolucion TEXT NULL;
    `);
    await queryRunner.query(`
      UPDATE alertas_incidentes SET estado = 'PENDIENTE' WHERE estado IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS ix_alertas_estado ON alertas_incidentes (estado);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET search_path TO asistencia_proactiva;`);
    await queryRunner.query(`DROP INDEX IF EXISTS ix_alertas_estado;`);
    await queryRunner.query(`
      ALTER TABLE alertas_incidentes DROP COLUMN IF EXISTS notas_resolucion;
    `);
    await queryRunner.query(`
      ALTER TABLE alertas_incidentes DROP COLUMN IF EXISTS resuelta_en;
    `);
    await queryRunner.query(`
      ALTER TABLE alertas_incidentes DROP COLUMN IF EXISTS estado;
    `);
  }
}
