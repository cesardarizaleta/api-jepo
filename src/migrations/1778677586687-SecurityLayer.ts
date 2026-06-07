import { MigrationInterface, QueryRunner } from "typeorm";

export class SecurityLayer1778677586687 implements MigrationInterface {
    name = 'SecurityLayer1778677586687' // Deja el nombre que te haya generado tu archivo

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Aseguramos el esquema
        await queryRunner.query(`SET search_path TO asistencia_proactiva;`);

        // 1. Usuarios: agregar password_changed_at y unicidad en telefono
        await queryRunner.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NULL;`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_telefono ON usuarios (telefono) WHERE deleted_at IS NULL;`);

        // 2. Contactos de emergencia
        await queryRunner.query(`ALTER TABLE contactos_emergencia ADD COLUMN IF NOT EXISTS estado_verificacion VARCHAR(20) NOT NULL DEFAULT 'PENDING';`);
        await queryRunner.query(`ALTER TABLE contactos_emergencia ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ NULL;`);

        // 3. Tabla centralizada de OTPs
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS verification_codes (
                id                BIGSERIAL PRIMARY KEY,
                purpose           VARCHAR(40)  NOT NULL,
                subject_type      VARCHAR(40)  NOT NULL,
                subject_id        BIGINT       NOT NULL,
                code_hash         VARCHAR(128) NOT NULL,
                delivery_channel  VARCHAR(20)  NOT NULL,
                delivery_target   VARCHAR(160) NOT NULL,
                attempts          SMALLINT     NOT NULL DEFAULT 0,
                max_attempts      SMALLINT     NOT NULL DEFAULT 3,
                expires_at        TIMESTAMPTZ  NOT NULL,
                consumed_at       TIMESTAMPTZ  NULL,
                invalidated_at    TIMESTAMPTZ  NULL,
                ip_requester      VARCHAR(64)  NULL,
                user_agent        VARCHAR(255) NULL,
                created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );
        `);

        // Índices
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS ix_verification_codes_lookup ON verification_codes (purpose, subject_type, subject_id, consumed_at);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS ix_verification_codes_expires_at ON verification_codes (expires_at);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`SET search_path TO asistencia_proactiva;`);
        
        // Deshacemos todo en orden inverso
        await queryRunner.query(`DROP INDEX IF EXISTS ix_verification_codes_expires_at;`);
        await queryRunner.query(`DROP INDEX IF EXISTS ix_verification_codes_lookup;`);
        await queryRunner.query(`DROP TABLE IF EXISTS verification_codes;`);
        
        await queryRunner.query(`ALTER TABLE contactos_emergencia DROP COLUMN IF EXISTS accepted_at;`);
        await queryRunner.query(`ALTER TABLE contactos_emergencia DROP COLUMN IF EXISTS estado_verificacion;`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS ux_usuarios_telefono;`);
        await queryRunner.query(`ALTER TABLE usuarios DROP COLUMN IF EXISTS password_changed_at;`);
    }
}