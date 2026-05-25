# Pom'Pom — Vergers des Abers

Site vitrine du producteur de jus de pommes Pom'Pom (Plouguerneau, 29). Monorepo
React + Fastify + Postgres, déployable en Docker Compose sur un VPS OVH.

## Stack

- **Front** (`apps/web`) : React 18 · Vite 6 · TypeScript (strict) · Tailwind · shadcn/ui · TanStack Query · TipTap (WYSIWYG) · `React.lazy` code-splitting par route
- **API** (`apps/api`) : Fastify 5 · Prisma · PostgreSQL 16 · argon2 · JWT (cookie httpOnly) · sanitize-html · `@fastify/rate-limit` (anti brute-force login) · `@fastify/helmet` (CSP en prod)
- **Email transactionnel** : Resend (formulaire de contact, `apps/api/src/emails/`)
- **Outils** : Bun (package manager + runtime) · Docker Compose · Bun workspaces · Husky + lint-staged + Prettier · GitHub Actions CI

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

### Formulaire de contact (Resend)

Le formulaire `/contact` envoie un email via [Resend](https://resend.com). En dev, l'API boot **même sans `RESEND_API_KEY`** (le client n'est instancié qu'à l'appel), mais une soumission renverra alors `500`. Pour tester localement de bout en bout :

```bash
# Dans le .env racine :
RESEND_API_KEY=re_xxx          # clé Resend (créer un compte gratuit)
CONTACT_EMAIL_TO=ton@email.fr  # destinataire
CONTACT_EMAIL_FROM=noreply@<domaine-vérifié-dans-resend>
```

Variables aussi documentées dans `.env.example`.

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

# Format Prettier sur tout le monorepo (à la racine, hors container)
bun run format         # reformate
bun run format:check   # check uniquement (utilisé en CI éventuellement)

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

## Qualité — CI et pre-commit

**CI** : `.github/workflows/ci.yml` lance 2 jobs en parallèle sur chaque PR (et sur push `main`) :

- `api` — service Postgres 16, `bun install` → `bun audit` (non bloquant) → `prisma generate` → lint → tests vitest → build TS
- `web` — `bun install` → `bun audit` (non bloquant) → lint → tests vitest → build (`tsc + vite build`)

Un `concurrency` group annule les runs précédents en cas de re-push sur la même branche.

**Pre-commit** : Husky lance `bunx lint-staged` au `git commit`. Selon les fichiers staged :

- `apps/web/**/*.{ts,tsx,css}` → `eslint` + `prettier --write`
- `apps/api/**/*.ts` → `eslint` + `prettier --write`
- `**/*.{json,md,yml,yaml}` → `prettier --write`

L'install Husky est automatique via le script `prepare` au `bun install` racine.

## Compression d'images

Script ponctuel pour convertir les `.jpg` lourds en `.webp` :

```bash
bun run --cwd apps/web scripts/compress-images.ts
```

Paramètres dans le script (`apps/web/scripts/compress-images.ts`) : `MAX_WIDTH=1440`, `QUALITY=72`. Cibles : assets > 800 Ko. Sortie WebP à côté du source, .jpg sources à supprimer manuellement après vérification visuelle.

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
   # éditer .env :
   #   POSTGRES_*, JWT_SECRET (openssl rand -base64 48),
   #   CORS_ORIGIN, VITE_API_URL, ADMIN_EMAIL, ADMIN_PASSWORD,
   #   RESEND_API_KEY (formulaire de contact), CONTACT_EMAIL_TO, CONTACT_EMAIL_FROM,
   #   AUTH_LOGIN_RATE_LIMIT_MAX (défaut : 5 essais / minute / IP)
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

### `Cannot find module '@fastify/<plugin>'` au démarrage du container API

Tu as ajouté une dépendance côté host (`bun add` local) sans rebuild le container. Le volume nommé `api_node_modules` ne se synchronise pas automatiquement :

```bash
docker compose exec api bun install   # rapide
# ou
docker compose up -d --build api      # si l'install in-place plante
```

## TODO MEP

Voir [`TODO.md`](./TODO.md) pour la checklist exhaustive (sécurité, légal, perf,
a11y, infra) avant ouverture publique du site.
