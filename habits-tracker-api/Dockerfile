# Imagen del API (HU-01 §6). Dos etapas: la primera compila con todas las dependencias;
# la segunda solo lleva lo necesario para ejecutar, y por eso pesa menos.

FROM node:20-alpine AS compilacion
# Prisma necesita OpenSSL en Alpine para su motor de consultas.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
COPY --from=compilacion /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=compilacion /app/dist ./dist
EXPOSE 3000
# Al arrancar se aplican las migraciones pendientes (incluido el catálogo de categorías).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
