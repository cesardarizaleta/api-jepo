# API JEPO

API REST para el sistema de Asistencia Proactiva a Personas, construida con NestJS, PostgreSQL y TypeORM.

## Caracteristicas

- Prefijo global de API: `/api`
- Rate limit global con `@nestjs/throttler`
- Validaciones con `class-validator` y `ValidationPipe`
- Manejo global de errores con formato JSON uniforme
- Soft delete en usuarios, contactos de emergencia y alertas
- Respuesta estandar: `{ success, message, data }`

## Modulos implementados

- Usuarios: CRUD completo + actualizacion de `token_fcm`
- Contactos de emergencia: CRUD completo por usuario + limite maximo de 5 contactos
- Alertas de incidentes: CRUD completo + logica proactiva en `POST /api/alertas`

## Configuracion

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo `.env` usando `.env.example` como base.

3. Ejecutar en desarrollo:

```bash
npm run start:dev
```

## Variables de entorno

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=api_jepo
DB_SCHEMA=asistencia_proactiva
DB_SYNC=true
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
```

## Endpoints principales

### Health

- `GET /api/health`

### Usuarios

- `POST /api/usuarios`
- `GET /api/usuarios`
- `GET /api/usuarios/:id`
- `PATCH /api/usuarios/:id`
- `PATCH /api/usuarios/:id/token-fcm`
- `DELETE /api/usuarios/:id`

### Contactos de emergencia

- `POST /api/usuarios/:idUsuario/contactos`
- `GET /api/usuarios/:idUsuario/contactos`
- `GET /api/usuarios/:idUsuario/contactos/:id`
- `PATCH /api/usuarios/:idUsuario/contactos/:id`
- `DELETE /api/usuarios/:idUsuario/contactos/:id`

### Alertas

- `POST /api/alertas`
- `GET /api/alertas`
- `GET /api/alertas/:id`
- `PATCH /api/alertas/:id`
- `DELETE /api/alertas/:id`

## Ejemplo de respuesta

```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": {}
}
```

## Pruebas

```bash
npm run test
npm run test:e2e
```
