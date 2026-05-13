-- ============================================================
-- Migracion: Capa de seguridad (OTP hibrido + verificacion de contactos)
-- Fecha: 2026-05-13
-- ============================================================

SET search_path TO asistencia_proactiva;

-- 1. Usuarios: agregar password_changed_at y unicidad en telefono
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NULL;

-- Unicidad de telefono (elimina duplicados antes si existieran)
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_telefono
  ON usuarios (telefono)
  WHERE deleted_at IS NULL;

-- 2. Contactos de emergencia: agregar estado_verificacion y accepted_at
ALTER TABLE contactos_emergencia
  ADD COLUMN IF NOT EXISTS estado_verificacion VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ NULL;

-- 3. Tabla centralizada de OTPs
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

CREATE INDEX IF NOT EXISTS ix_verification_codes_lookup
  ON verification_codes (purpose, subject_type, subject_id, consumed_at);

CREATE INDEX IF NOT EXISTS ix_verification_codes_expires_at
  ON verification_codes (expires_at);
