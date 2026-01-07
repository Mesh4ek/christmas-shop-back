# ---- build stage ----
FROM node:24-alpine AS builder
WORKDIR /app

# Для зависимостей с нативной сборкой (если такие есть)
RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Надёжно: ci если есть lock, иначе install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

RUN npx prisma generate
RUN npm run build

# Убираем dev-зависимости перед переносом в runtime
RUN npm prune --omit=dev

# ---- runtime stage ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install build dependencies for Prisma generate
RUN apk add --no-cache openssl

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Copy generated Prisma client from builder stage
COPY --from=builder --chown=node:node /app/src/generated ./src/generated

# Copy assets folder for product images
COPY --from=builder --chown=node:node /app/assets ./assets

# Also regenerate Prisma client in runtime stage as a fallback
RUN npx prisma generate || echo "Warning: Prisma generate failed, using copied client"

USER node
EXPOSE 3000

CMD ["node", "dist/server.js"]
