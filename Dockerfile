FROM node:22-alpine

WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Compilamos la aplicación de Next.js para producción
RUN npm run build

# Exponemos el puerto 3000
EXPOSE 3000

# Iniciamos la aplicación
CMD ["npm", "start"]
