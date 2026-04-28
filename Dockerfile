# ==========================================
# Etapa 1: Build (Construcción)
# ==========================================
FROM node:20-alpine AS builder

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias exactas usando ci
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación NestJS
RUN npm run build

# Limpiar dependencias de desarrollo y dejar solo las de producción
# Esto reduce drásticamente el tamaño final de la imagen
RUN npm ci --only=production && npm cache clean --force

# ==========================================
# Etapa 2: Production (Ejecución)
# ==========================================
FROM node:20-alpine AS production

# Variables de entorno por defecto
ENV NODE_ENV=production

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Cambiar el usuario por motivos de seguridad (evitar correr como root)
RUN chown node:node /usr/src/app
USER node

# Copiar package.json (necesario para definir algunos comportamientos de node)
COPY --chown=node:node package*.json ./

# Copiar dependencias de producción desde la etapa de build
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules

# Copiar los binarios compilados
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# El puerto se obtiene del .env y se mapeará al momento de correr el contenedor
EXPOSE ${PORT:-9002}

# Comando por defecto para iniciar en producción
CMD ["node", "dist/main.js"]
