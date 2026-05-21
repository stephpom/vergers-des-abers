# Pom'Pom — Vergers des Abers

Site vitrine du producteur de jus de pommes Pom'Pom (Plouguerneau, 29). Monorepo
React + Fastify + Postgres, déployable en Docker Compose sur un VPS OVH.

## Stack

- **Front** (`apps/web`) : React 18 · Vite 6 · TypeScript · Tailwind · shadcn/ui · TanStack Query · TipTap (WYSIWYG)
- **API** (`apps/api`) : Fastify 5 · Prisma · PostgreSQL 16 · argon2 · JWT (cookie httpOnly) · sanitize-html
- **Outils** : Bun (package manager + runtime) · Docker Compose · npm workspaces

## Prérequis

- [Bun](https://bun.sh) >= 1.3 (pour dev en local hors Docker)
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2 (dev complet et prod)

## Démarrage en local (Docker — recommandé)

```bash
# 1. Builder et démarrer les 3 services (db / api / web)
docker compose up -d --build

# 2. PREMIÈRE FOIS UNIQUEMENT — créer la migration initiale (avec un nom explicite,
#    sinon prisma demande un prompt interactif et hang sous `docker compose exec -T`)
docker compose exec api bunx prisma migrate dev --name init

# 3. Seed (crée le user admin depuis ADMIN_EMAIL / ADMIN_PASSWORD)
docker compose exec api bun run prisma:seed

# 4. C'est en ligne :
#    Front  → http://localhost:5173
#    API    → http://localhost:3001  (health: /health)
#    Admin  → http://localhost:5173/admin/login
```

Pour les **migrations suivantes** (modifs du `schema.prisma`), utilise simplement :
`docker compose exec api bun run prisma:migrate` (qui exécute `prisma migrate dev`).

### Identifiants admin

Sans `.env` racine, défauts du `docker-compose.yml` :
- email : `admin@pompom.fr`
- password : `pompom_dev_admin`

Avec un `.env` racine, ce sont les valeurs `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env` qui s'appliquent (override des défauts compose).

> ⚠️ **Piège `.env`** : un `#` dans une valeur sans quotes est interprété comme début de commentaire et tronque la valeur. Si ton `ADMIN_PASSWORD=mon#password`, mets-le entre guillemets : `ADMIN_PASSWORD="mon#password"`. Sinon l'API plante au démarrage avec `String must contain at least 8 character(s)`.

## Démarrage en local (sans Docker)

```bash
# 1. Installer les deps des deux workspaces
bun install

# 2. Lancer Postgres dans Docker (uniquement la db)
docker compose up -d db

# 3. Créer le .env racine (source unique pour toutes les vars)
cp .env.example .env
# Adapter DATABASE_URL pour pointer sur localhost:5432 :
#   POSTGRES_USER=pompom
#   POSTGRES_PASSWORD=pompom
# Et l'API utilisera : postgresql://pompom:pompom@localhost:5432/pompom
# (à définir dans le .env via DATABASE_URL si différent des défauts compose)

# 4. Lier le .env racine aux apps qui en ont besoin (apps/api : lecture auto par Bun depuis son CWD)
ln -sf ../../.env apps/api/.env       # symlink → vise le .env racine
# apps/web : pas besoin, vite.config.ts a `envDir: '../..'` (lit déjà le .env racine)

# 5. Préparer la base
bun run --cwd apps/api prisma:migrate
bun run --cwd apps/api prisma:seed

# 6. Lancer api + web en parallèle
bun run dev          # tous les workspaces
# ou séparément :
bun run dev:api      # http://localhost:3001
bun run dev:web      # http://localhost:5173
```

> Sous Windows sans support symlinks, remplace l'étape 4 par : `cp .env apps/api/.env` (à re-faire à chaque modif du `.env` racine).

## Structure

```
.
├── apps/
│   ├── api/                  # Backend Fastify + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── routes/       # /api/auth, /api/products, /api/admin
│   │       ├── services/     # auth, product, image
│   │       ├── middleware/   # authenticate (JWT cookie)
│   │       ├── lib/          # prisma, auth helpers, slug
│   │       ├── app.ts        # factory Fastify
│   │       └── server.ts     # entry point
│   └── web/                  # Front React + Vite
│       └── src/
│           ├── pages/
│           │   ├── Index.tsx ProductDetail.tsx Contact.tsx NotFound.tsx
│           │   └── admin/    # Login Products ProductForm
│           ├── components/
│           │   ├── admin/RichTextEditor.tsx  # TipTap
│           │   ├── PrivateRoute.tsx
│           │   ├── ProductCard.tsx
│           │   └── ui/       # shadcn
│           ├── contexts/AuthContext.tsx
│           ├── lib/api.ts    # client fetch
│           └── types/api.ts
├── docker-compose.yml        # DEV
├── docker-compose.prod.yml   # PROD (VPS OVH)
├── .env.example              # variables prod
└── TODO.md                   # checklist MEP exhaustive
```

## Commandes principales

> **Convention** : toutes les commandes `bun` (incl. `bun add`, `bun install`, `bun run`, `bunx`) **se lancent dans le container Docker concerné**, jamais sur l'host. Le `package.json` et le `bun.lockb` sont bind-montés → toute modification de deps depuis le container est immédiatement visible côté host (et donc commitable).

```bash
# Ajouter / mettre à jour des dépendances (front)
docker compose exec web bun add <pkg>
docker compose exec web bun add -d <pkg>          # devDependency
docker compose exec web bun remove <pkg>

# Idem côté API
docker compose exec api bun add <pkg>

# Front (toujours dans le container)
docker compose exec web bun run build             # bundle prod
docker compose exec web bun run lint
docker compose exec web bun run test

# API (toujours dans le container)
docker compose exec api bun run prisma:generate
docker compose exec api bunx prisma migrate dev --name <nom>   # première fois ET nouvelles migrations
docker compose exec api bun run prisma:migrate:deploy           # prod
docker compose exec api bun run prisma:seed
docker compose exec api bun run prisma:studio                   # GUI base (port 5555)
docker compose exec api bun run test
```

Après un `bun add` qui ajoute un import dans le code source, Vite/Bun détectent automatiquement le changement et reloadent. Si Vite affiche "Failed to resolve import", relance simplement le container : `docker compose restart web` (le volume `node_modules` du container est mis à jour par le `bun add`).

## Déploiement sur VPS OVH

1. **Provisionner** un VPS (Debian 12 ou Ubuntu 24.04 minimum).
2. **Installer** Docker + Docker Compose v2 :
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. **Cloner** le repo sur le VPS :
   ```bash
   git clone <repo> /opt/pompom && cd /opt/pompom
   ```
4. **Configurer** les variables d'env :
   ```bash
   cp .env.example .env
   # éditer .env : POSTGRES_*, JWT_SECRET (openssl rand -base64 48),
   #                CORS_ORIGIN, VITE_API_URL, ADMIN_EMAIL, ADMIN_PASSWORD
   ```
5. **Démarrer** la stack :
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml exec api bun run prisma:seed
   ```
6. **Reverse proxy HTTPS** — installer Caddy en host (hors Compose) :
   ```bash
   apt install -y caddy
   # /etc/caddy/Caddyfile :
   # pompom.fr        { reverse_proxy 127.0.0.1:5173 }
   # api.pompom.fr    { reverse_proxy 127.0.0.1:3001 }
   systemctl restart caddy
   ```
   Caddy gère automatiquement Let's Encrypt + renouvellement SSL.

## Tests

Les tests d'intégration backend utilisent une base PostgreSQL dédiée (port 5433).

```bash
# 1. Démarrer la base de test
docker compose up -d db_test

# 2. Lancer les tests
bun run --cwd apps/api test
```

Le setup (`apps/api/src/tests/setup.ts`) applique automatiquement les migrations Prisma sur
la base test et tronque les tables entre chaque test. Aucune configuration manuelle n'est
nécessaire au-delà du `docker compose up -d db_test`.

Pour lancer en mode watch :

```bash
bun run --cwd apps/api test:watch
```

## Troubleshooting

### `Container is restarting, wait until the container is running`

L'API crashe au démarrage et compose la redémarre en boucle. Vérifie les logs :
```bash
docker compose logs api --tail 30
```
Cause fréquente : variable d'env mal formée dans le `.env` racine (voir le piège `#` ci-dessus).

### `Can't reach database server at db:5432`

Le hostname `db` ne résout plus depuis le container API → network Docker corrompu (état orphelin après une session interrompue). Recrée tout proprement (le volume `pgdata` est nommé, les données persistent) :
```bash
docker compose down
docker compose up -d
```

### `P1002 timed out` / `pg_advisory_lock` bloqué

Un précédent `prisma migrate` a planté en laissant un lock advisory. Restart `db` (libère les locks) et `api` (libère les connexions Prisma actives) :
```bash
docker compose restart db api
```

### `bun install` échoue avec `EEXIST: failed to link package` pendant le build Docker

Bug connu de Bun avec les hardlinks sur overlayfs Docker. Les Dockerfiles utilisent déjà `bun install --frozen-lockfile --backend=copyfile` qui force la copie. Si l'erreur revient malgré tout : `docker compose build --no-cache`.

## TODO MEP

Voir [`TODO.md`](./TODO.md) pour la checklist exhaustive (sécurité, légal, perf,
a11y, infra) avant ouverture publique du site.
