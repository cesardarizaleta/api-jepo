# Instrucciones de Copilot para el proyecto

Actua como un desarrollador Backend Senior.

## Contexto del proyecto

Este proyecto corresponde a una tesis de Ingenieria: **Sistema de Asistencia Proactiva a Personas**.

### Objetivo

Construir una API REST robusta para gestionar la seguridad de un usuario mediante deteccion automatica de incidentes.

## Stack tecnologico obligatorio

- Node.js con Express.
- PostgreSQL usando `pg` o Sequelize.
- Todas las respuestas deben ser en formato JSON.

## Modelo de datos principal

Trabajar con estas 3 tablas principales:

Todas pertenecen al esquema `asistencia_proactiva`.

1. `usuarios`:
   - `id`
   - `nombre`
   - `apellido`
   - `email`
   - `telefono`
   - `token_fcm`
2. `contactos_emergencia`:
   - `id`
   - `id_usuario`
   - `nombre_contacto`
   - `telefono_contacto`
   - `prioridad`
3. `alertas_incidentes`:
   - `id`
   - `id_usuario`
   - `latitud`
   - `longitud`
   - `url_audio_contexto`
   - `fecha_hora`
   - `es_proactiva`

## Funcionalidades requeridas

### 1) Modulo de Usuario

- CRUD basico de usuarios.
- Registro y actualizacion de `token_fcm` para notificaciones push.

### 2) Modulo de Contactos de Emergencia

- Gestion completa de la red de confianza por usuario.
- Limite estricto: maximo 5 contactos por usuario.

### 3) Logica de Alerta (Critico)

- Implementar `POST /alertas`.
- Debe recibir coordenadas (`latitud`, `longitud`) y `url_audio_contexto`.
- Debe recibir `es_proactiva`.
- Si `es_proactiva` es `true`, retornar la lista de contactos de emergencia asociados al usuario para iniciar protocolo de aviso.

## Restricciones tecnicas

- Usar validaciones con `express-validator` en endpoints.
- Implementar manejo de errores global (middleware centralizado).
- La precision de `latitud` y `longitud` debe ser de **8 decimales**.

## Lineamientos NestJS obligatorios

- Usar unicamente librerias del ecosistema NestJS cuando exista alternativa oficial.
- Priorizar paquetes `@nestjs/*` para arquitectura, seguridad, configuracion y utilidades.
- Para ORM, usar TypeORM como opcion principal dentro del enfoque NestJS.
- Para validaciones y transformacion, usar `class-validator` y `class-transformer` integrados con DTOs y pipes de NestJS.
- Evitar incorporar librerias externas si la necesidad ya esta cubierta por herramientas oficiales de NestJS.
- Siempre crear modulos, controladores y servicios mediante Nest CLI.
- Usar comandos de CLI para scaffolding, por ejemplo: `nest g module`, `nest g controller`, `nest g service`.
- Disenar e implementar siempre bajo buenas practicas SOLID.
- Mantener modularizacion estricta y arquitectura limpia alineada a patrones de NestJS.

## Estructura base esperada

Generar y mantener una estructura de backend con:

- `controllers/`
- `routes/`
- `models/`

Ademas, generar el codigo inicial del servidor Express con configuracion base para:

- middlewares esenciales,
- rutas principales,
- manejo global de errores,
- respuesta JSON consistente.

## Criterios de calidad esperados

- Codigo modular, legible y mantenible.
- Separacion clara de responsabilidades por capas.
- Validaciones y mensajes de error claros.
- Buenas practicas de seguridad en API.
- Preparado para escalar en nuevos modulos de deteccion/protocolo.