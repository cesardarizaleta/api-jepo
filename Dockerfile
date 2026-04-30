FROM node:20-alpine

WORKDIR /app

# Instalar dependencias (se cachea si no cambia el package.json)
COPY package*.json ./
RUN npm install --quiet

# Copiar el código y compilar
COPY . .
RUN npm run build

# Eliminar dependencias de desarrollo (mucho más rápido que reinstalar)
RUN npm prune --production

# Variables de entorno y puerto
ENV NODE_ENV=production
EXPOSE 9002

# Iniciar la aplicación
CMD ["node", "dist/main.js"]

