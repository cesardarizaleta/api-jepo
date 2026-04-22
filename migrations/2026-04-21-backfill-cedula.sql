-- Backup your DB before running this script!
-- 2026-04-21: Backfill contactos_incidentes and alertas to use usuarios.cedula
BEGIN;

-- 0) Quick diagnostics: distinct cedula_usuario values that do not match usuarios.cedula
-- Run these first to inspect what's orphaned
-- SELECT DISTINCT ce.cedula_usuario AS orphan_value, count(*) FROM asistencia_proactiva.contactos_emergencia ce
-- LEFT JOIN asistencia_proactiva.usuarios u ON ce.cedula_usuario = u.cedula
-- WHERE u.cedula IS NULL
-- GROUP BY ce.cedula_usuario ORDER BY count DESC;

-- SELECT DISTINCT al.cedula_usuario AS orphan_value, count(*) FROM asistencia_proactiva.alertas_incidentes al
-- LEFT JOIN asistencia_proactiva.usuarios u ON al.cedula_usuario = u.cedula
-- WHERE u.cedula IS NULL
-- GROUP BY al.cedula_usuario ORDER BY count DESC;

-- 1) Backup orphan rows into temp tables for review/rollback
CREATE TABLE IF NOT EXISTS backup_contactos_orphans AS
SELECT ce.* FROM asistencia_proactiva.contactos_emergencia ce
LEFT JOIN asistencia_proactiva.usuarios u ON ce.cedula_usuario = u.cedula
WHERE u.cedula IS NULL;

CREATE TABLE IF NOT EXISTS backup_alertas_orphans AS
SELECT al.* FROM asistencia_proactiva.alertas_incidentes al
LEFT JOIN asistencia_proactiva.usuarios u ON al.cedula_usuario = u.cedula
WHERE u.cedula IS NULL;

-- 2) Try to map orphan cedula_usuario values that actually contain usuarios.id (legacy id)
-- Only update rows that are currently orphan (no matching usuarios.cedula) and where cedula_usuario equals a usuarios.id
UPDATE asistencia_proactiva.contactos_emergencia ce
SET cedula_usuario = u.cedula
FROM asistencia_proactiva.usuarios u
WHERE NOT EXISTS (SELECT 1 FROM asistencia_proactiva.usuarios u2 WHERE u2.cedula = ce.cedula_usuario)
  AND ce.cedula_usuario = u.id;

UPDATE asistencia_proactiva.alertas_incidentes al
SET cedula_usuario = u.cedula
FROM asistencia_proactiva.usuarios u
WHERE NOT EXISTS (SELECT 1 FROM asistencia_proactiva.usuarios u2 WHERE u2.cedula = al.cedula_usuario)
  AND al.cedula_usuario = u.id;

-- 3) Show remaining orphan rows for manual inspection
-- SELECT * FROM asistencia_proactiva.contactos_emergencia ce
-- LEFT JOIN asistencia_proactiva.usuarios u ON ce.cedula_usuario = u.cedula
-- WHERE u.cedula IS NULL LIMIT 200;

-- SELECT * FROM asistencia_proactiva.alertas_incidentes al
-- LEFT JOIN asistencia_proactiva.usuarios u ON al.cedula_usuario = u.cedula
-- WHERE u.cedula IS NULL LIMIT 200;

COMMIT;

-- If you need to rollback the updates done above, you can restore from the backup tables:
-- UPDATE asistencia_proactiva.contactos_emergencia ce
-- SET cedula_usuario = b.cedula_usuario
-- FROM backup_contactos_orphans b
-- WHERE ce.id = b.id;

-- UPDATE asistencia_proactiva.alertas_incidentes al
-- SET cedula_usuario = b.cedula_usuario
-- FROM backup_alertas_orphans b
-- WHERE al.id_alerta = b.id_alerta;
