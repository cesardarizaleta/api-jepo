import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoAlertStatuses1778700000001 implements MigrationInterface {
  name = 'AutoAlertStatuses1778700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET search_path TO asistencia_proactiva;`);

    // CANCELADA y FALSO_POSITIVO son equivalentes.
    await queryRunner.query(`
      UPDATE alertas_incidentes
      SET estado = 'FALSO_POSITIVO'
      WHERE estado = 'CANCELADA';
    `);

    // Previamente canceladas vía PATCH (estoy bien / es_proactiva=false).
    await queryRunner.query(`
      UPDATE alertas_incidentes
      SET estado = 'FALSO_POSITIVO',
          resuelta_en = COALESCE(resuelta_en, updated_at, created_at, NOW())
      WHERE estado = 'PENDIENTE'
        AND resuelta_en IS NOT NULL;
    `);

    // El resto de pendientes son alertas que ya se enviaron a contactos.
    await queryRunner.query(`
      UPDATE alertas_incidentes
      SET estado = 'REAL',
          resuelta_en = COALESCE(resuelta_en, fecha_hora, created_at, NOW())
      WHERE estado = 'PENDIENTE';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No reversible de forma segura: los estados automáticos no se distinguen del histórico.
    await queryRunner.query(`SET search_path TO asistencia_proactiva;`);
  }
}
