FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Primero solo las dependencias, para aprovechar la caché de Docker
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3000
USER node
CMD ["node", "src/server.js"]
