# syntax=docker/dockerfile:1.7

# ----- base -----
FROM oven/bun:1.3-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ----- deps -----
FROM base AS deps
COPY package.json bun.lockb* ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN bun install --frozen-lockfile --backend=copyfile

# ----- dev -----
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
WORKDIR /app/apps/api
ENV NODE_ENV=development
EXPOSE 3001
CMD ["sh", "-c", "bun run prisma:generate && bun --watch run src/server.ts"]

# ----- build -----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN bun run prisma:generate
RUN bun run build

# ----- prod -----
FROM base AS prod
ENV NODE_ENV=production
WORKDIR /app
# Reproduire l'arbre workspace du stage build : le store réel des deps vit dans
# le node_modules RACINE (/app/node_modules/.bun/...), celui de l'api n'est que
# des symlinks vers lui. Copier uniquement apps/api/node_modules laissait tous
# les symlinks orphelins (prisma, @prisma/client, fastify... introuvables).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
# src/ requis uniquement pour le seed one-shot (prisma/seed.ts importe
# ../src/lib/auth.js) ; le serveur, lui, tourne sur dist/.
COPY --from=build /app/apps/api/src ./apps/api/src
WORKDIR /app/apps/api
RUN mkdir -p /app/uploads
EXPOSE 3001
CMD ["bun", "run", "start"]
