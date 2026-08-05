# syntax=docker/dockerfile:1.7

# ----- base -----
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# ----- deps -----
FROM base AS deps
COPY package.json bun.lockb* ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN bun install --frozen-lockfile --backend=copyfile

# ----- dev -----
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
WORKDIR /app/apps/web
ENV NODE_ENV=development
EXPOSE 5173
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]

# ----- build -----
FROM base AS build
ARG VITE_API_URL
ARG VITE_PUBLIC_SITE_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_PUBLIC_SITE_URL=${VITE_PUBLIC_SITE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN bun run build

# ----- prod (nginx static) -----
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
