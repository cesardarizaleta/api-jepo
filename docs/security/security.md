# Capa de Seguridad (OTP híbrido + Opt-in de contactos)

## Migración de BD

Aplicar antes de arrancar la API: [`migrations/2026-05-13-security-layer.sql`](../../migrations/2026-05-13-security-layer.sql)

Resumen de cambios:

- `usuarios`: nueva columna `password_changed_at TIMESTAMPTZ`.
- `usuarios`: índice único sobre `telefono` (respetando `deleted_at`).
- `contactos_emergencia`: `estado_verificacion VARCHAR(20) NOT NULL DEFAULT 'PENDING'` y `accepted_at TIMESTAMPTZ`.
- Nueva tabla `verification_codes` (OTPs centralizados y polimórficos).

## Decisiones clave

- OTP: 6 dígitos, TTL 15 min, hash HMAC-SHA256(pepper, `${purpose}:${subjectId}:${plainCode}`).
- Intentos por challenge: 3 (bloquea al superarse).
- Cooldown entre reenvíos: 60 s. Máximo 3 reenvíos activos por sujeto/propósito.
- Comparación del OTP: `crypto.timingSafeEqual` sobre hashes del mismo largo.
- Anti enumeración: `POST /auth/forgot-password` siempre responde igual y ejecuta el envío en background.
- Invalidación de JWT por reset: `JwtAuthGuard` compara `iat` con `usuarios.password_changed_at`.
- Alertas proactivas: solo se envían a contactos `estado_verificacion = 'VERIFIED'`.

## Endpoints nuevos

### Auth

- `POST /api/auth/forgot-password`
  - body: `{ "email_or_phone": "string", "method": "email" | "whatsapp" }`
  - respuesta (siempre): `{ message: "Si la cuenta existe, recibiras un codigo de verificacion" }`
- `POST /api/auth/reset-password`
  - body: `{ "email_or_phone": "string", "otp": "123456", "new_password": "Passw0rd!" }`
  - política: mín. 8 chars, 1 mayúscula, 1 número.

### Contactos de emergencia

- `POST /api/usuarios/contactos`: crea el contacto en estado `PENDING` y dispara OTP por WhatsApp.
- `POST /api/usuarios/contactos/:id/verificar` body `{ "codigo": "123456" }`.
- `POST /api/usuarios/contactos/:id/reenviar-codigo` (cooldown 60 s, máx 3 activos).

## Throttling específico

- `forgot-password`, `reset-password`: 5 req / 60 s (encima del throttler global).
- `verificar` contacto: 10 req / 60 s.
- `reenviar-codigo`: 5 req / 60 s.

## Módulos involucrados

- `src/common/verification/` — `VerificationService`, entidad `VerificationCode`, enums.
- `src/common/evolution/` — cliente Evolution compartido (antes duplicado en `incident-alerts`).
- `src/common/mailer/` — stub de Nodemailer (pendiente transporte real).
- `src/auth/` — nuevos endpoints `forgot/reset`.
- `src/emergency-contacts/` — estado de verificación, verificar, reenviar.
- `src/common/guards/jwt-auth.guard.ts` — invalidación por `password_changed_at`.

## Pendientes

- Implementar transporte real de Nodemailer en `MailerService`.
- Job de purga diaria de `verification_codes` expirados (ej. via `@nestjs/schedule`).
- Normalización E.164 del teléfono en DTOs (hoy se valida largo; se recomienda regex E.164 estricta).
