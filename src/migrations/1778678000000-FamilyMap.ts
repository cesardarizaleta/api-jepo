import { MigrationInterface, QueryRunner } from 'typeorm';

export class FamilyMap1778678000000 implements MigrationInterface {
  name = 'FamilyMap1778678000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET search_path TO asistencia_proactiva;`);

    await queryRunner.query(
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultima_latitud DECIMAL(10,8) NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultima_longitud DECIMAL(11,8) NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_ultima_ubicacion TIMESTAMPTZ NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET search_path TO asistencia_proactiva;`);

    await queryRunner.query(
      `ALTER TABLE usuarios DROP COLUMN IF EXISTS fecha_ultima_ubicacion;`,
    );
    await queryRunner.query(
      `ALTER TABLE usuarios DROP COLUMN IF EXISTS ultima_longitud;`,
    );
    await queryRunner.query(
      `ALTER TABLE usuarios DROP COLUMN IF EXISTS ultima_latitud;`,
    );
  }
}
