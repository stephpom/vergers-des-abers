# TODO — Pom'Pom Vergers des Abers

Checklist exhaustive avant mise en production. Issu de l'audit MEP du 2026-05-21.

Conventions de sévérité :
- 🔴 **Bloquant MEP** — à régler avant tout déploiement public
- 🟠 **Important** — à régler peu après la MEP
- 🟡 **Nice-to-have** — amélioration continue

---

## ✅ Refonte technique — TERMINÉE

- [x] Audit complet du projet
- [x] Audit des dépendances (`bun outdated`)
- [x] Script export Shopify one-shot (exécuté, store vide 402 → supprimé)
- [x] Restructuration en monorepo `apps/web` + `apps/api` (Bun workspaces)
- [x] Mise à jour `package.json` (Vite 6, plugin-react-swc 4, TanStack Query 5.100, hookform/resolvers 5, next-themes 0.4, Radix UI minor bumps, Vitest 3)
- [x] Suppression composants shadcn inutilisés (calendar, chart, command, drawer, input-otp, resizable, context-menu, menubar, navigation-menu)
- [x] Suppression deps inutilisées (lovable-tagger, recharts, cmdk, vaul, input-otp, react-resizable-panels, react-day-picker, zustand)
- [x] `docker-compose.yml` (db Postgres + db_test + api Fastify + web Vite)
- [x] `docker-compose.prod.yml` orienté VPS OVH
- [x] Dockerfiles multi-stage (dev + prod) pour `apps/api` et `apps/web` + `nginx.conf` SPA
- [x] Schema Prisma (User, Product, ProductImage)
- [x] Backend Fastify : routes auth + products publics + admin + upload images
- [x] Débrancher Shopify côté front (`lib/shopify*.ts`, `stores/cartStore.ts`, `components/CartDrawer.tsx`, prix, bouton "Acheter Maintenant" supprimés)
- [x] Refonte `Index.tsx` + `ProductDetail.tsx` (consomment `/api/products`)
- [x] Admin custom : `/admin/login`, `/admin/produits`, `/admin/produits/nouveau`, `/admin/produits/:id`
- [x] WYSIWYG TipTap pour description produit (toolbar gras / italique / titres / listes / citation / lien / undo / redo)
- [x] Upload images multipart côté admin + delete
- [x] Seed Prisma (admin depuis `ADMIN_EMAIL`/`ADMIN_PASSWORD`)
- [x] **Tests : 122 tests passants** (52 backend + 39 admin/infra front + 31 publics) cf. section dédiée plus bas

### À faire au premier démarrage

- [ ] Lancer `docker compose up --build` puis `docker compose exec api bun run prisma:migrate && bun run prisma:seed`
- [ ] Modifier `ADMIN_PASSWORD` dans le `docker-compose.yml` (actuellement `pompom_dev_admin` en dev)
- [ ] Tester le flux admin → créer un produit avec photo → vérifier qu'il apparaît sur la home publique

---

## 🧪 Tests — état actuel

**122 tests passants / 1 skip TipTap-jsdom / 0 échec** sur 19 fichiers.

### Backend (`apps/api/src/tests/` — 52 tests, nécessite `docker compose up -d db_test`)

| Fichier | Tests | Couvre |
|---|---:|---|
| `lib/slug.test.ts` | 5 | Slugify (accents, longueur, edge cases) |
| `lib/auth.test.ts` | 8 | hashPassword, verifyPassword, signToken, verifyToken |
| `auth.routes.test.ts` | 9 | login OK/KO, logout, GET /me, cookie httpOnly |
| `products.public.routes.test.ts` | 6 | GET list (published only), GET by slug, 404 |
| `products.admin.routes.test.ts` | 11 | CRUD avec auth, slug auto, validation zod, sanitize |
| `images.admin.routes.test.ts` | 9 | Upload multipart, MIME, taille, delete, fichier physique |
| `sanitize.test.ts` | 4 | sanitize-html (script retiré, href javascript bloqué, etc.) |

### Frontend admin + infra (`apps/web/src/tests/` — 39 + 1 skip)

| Fichier | Tests | Couvre |
|---|---:|---|
| `api.test.ts` | 7 | client fetch, FormData, 204, 401, 500 |
| `AuthContext.test.tsx` | 6 | loading, /me, login, logout |
| `PrivateRoute.test.tsx` | 3 | loader, redirect, children |
| `admin/Login.test.tsx` | 5 | validation, redirect state.from, toast 401 |
| `admin/Products.test.tsx` | 6 | liste, badges, modifier, supprimer, déconnexion |
| `admin/ProductForm.test.tsx` | 8 | création + édition + upload + delete image |
| `admin/RichTextEditor.test.tsx` | 5 (1 skip) | toolbar, état actif (1 skip TipTap-jsdom) |

### Frontend public (`apps/web/src/tests/public/` — 31)

| Fichier | Tests | Couvre |
|---|---:|---|
| `Index.test.tsx` | 12 | header, hero CTA, sections statiques, carousel, états produits, footer dynamique |
| `ProductDetail.test.tsx` | 8 | loader, 404, description HTML, gallery thumbnails, fallback no-image |
| `ProductCard.test.tsx` | 5 | image lazy + alt, lien, **assertion négative pas de prix/panier** |
| `Contact.test.tsx` | 3 | rendu, validation zod, comportement buggué actuel (`console.log`) — cf. **D1** |
| `NotFound.test.tsx` | 3 | 404, lien retour, `console.error` au mount — cf. **Q6** |

### Tests à compléter (post-MEP)

- [ ] **T1** — Test E2E du flux admin complet (créer produit → upload images → publier → vérifier visibilité publique). À faire avec Playwright si le projet grandit.
- [ ] **T2** — Tests de régression visuelle (snapshot Lighthouse + capture d'écran)
- [ ] **T3** — Tests de charge basiques (`oha`/`k6`) sur `/api/products` avant MEP
- [ ] **T4** — CI GitHub Actions qui lance backend + front en parallèle sur chaque PR

---

## 🔴 Sécurité (bloquants MEP)

- [x] **S1** — Token Shopify `cb16b20c...` **révoqué côté Shopify** par le propriétaire (2026-05-25), donc plus exploitable. La purge git historique devient cosmétique et n'est plus bloquante pour la MEP. (Reste 2 commits `feb0751` et `1117366` qui contiennent le token mort si nettoyage souhaité un jour.)
- [ ] **S2** — Générer `JWT_SECRET` aléatoire >= 48 chars en prod (`openssl rand -base64 48`)
- [ ] **S3** — Configurer CORS strict en prod : whitelist du domaine front uniquement (`CORS_ORIGIN`)
- [x] **S4** — `@fastify/helmet` activé (CSP désactivée par défaut dans `app.ts` — à durcir avec une vraie CSP avant MEP)
- [x] **S5** — `@fastify/rate-limit` v10.3 installé, registered avec `global: false` dans `app.ts`. POST `/login` config `max: 5 / 1 minute / IP` (override via `AUTH_LOGIN_RATE_LIMIT_MAX` et `AUTH_LOGIN_RATE_LIMIT_WINDOW`). Réponse 429 + header `retry-after`. **3 nouveaux tests** dans `rate-limit.routes.test.ts`. `.env.test` neutralise pour les autres suites (max=1000).
- [x] **S6** — Validation stricte uploads : whitelist MIME (`image/jpeg`, `image/png`, `image/webp`), taille max 5 Mo (cf. `image.service.ts`)
- [x] **S7** — Hash mot de passe en **argon2id** (cf. `lib/auth.ts`)
- [x] **S8** — Cookie JWT en `httpOnly`, `secure` en prod, `sameSite: lax`, expiration 7j (cf. `lib/auth.ts`)
- [x] **S9** — Token Shopify retiré du code (fichier `lib/shopify.ts` supprimé) — reste à purger l'historique git (cf. S1)
- [ ] **S10** — `bun audit` régulier (ajouter en CI — cf. T4)

## 🟠 Sécurité (post-MEP)

- [ ] **S11** — HTTPS obligatoire (Caddy/Traefik en reverse proxy sur VPS OVH)
- [ ] **S12** — Logs ne doivent jamais contenir passwords, tokens, données de cartes
- [x] **S13** — Sanitization HTML de la description produit côté API (sanitize-html dans `product.service.ts`) — couvert par 4 tests
- [ ] **S14** — Backup automatique DB Postgres (cron daily `pg_dump` → snapshot OVH)
- [ ] **S15** — Limite de taille body globale Fastify (anti-DoS)
- [ ] **S16** — Durcir la CSP `@fastify/helmet` (actuellement `contentSecurityPolicy: false` pour ne pas casser le dev)

---

## 🔴 Qualité code (bloquants techniques)

- [ ] **Q1** — Activer `strict: true` dans `apps/web/tsconfig.app.json` (actuellement off pour ne pas casser shadcn)
- [ ] **Q2** — Activer `noUnusedLocals: true`, `noUnusedParameters: true` côté web
- [x] **Q3** — `allowJs` absent de `apps/web/tsconfig.app.json` (donc `false` par défaut). Rien à faire.
- [ ] **Q4** — Configurer Prettier racine (`.prettierrc`)
- [x] **Q5** — Renommer projet : `package.json` racine `pompom-shop`, version `1.0.0`
- [~] **Q6** — Supprimer les `console.log` / `console.error` résiduels : ~~`Contact.tsx` (données form perso)~~ ✅ retiré via D1 + `NotFound.tsx` (mount) reste à faire.
- [x] **Q7** — Supprimé texte Lovable visible dans `Index.tsx` (« Propriétaire : Dites-moi quel produit... »)

## 🟠 Qualité code

- [x] **Q8** — Lint propre des 2 côtés : 2 erreurs préexistantes web fixées (`textarea.tsx` interface vide → type alias, `tailwind.config.ts` require → import ES) + `apps/api/eslint.config.js` créé (flat config v9, TS strict, env Node, ignores `dist`/`prisma/migrations`). Steps `Lint` ajoutés aux 2 jobs du workflow CI (entre install/prisma:generate et tests). 7 warnings `react-refresh` shadcn assumés (composants UI exportent un helper à côté — connu). Restent à activer `no-unused-vars: error` strict si voulu.
- [x] **Q9** — `apps/api` est en `strict: true` sans `any` non typé (TS strict dès la conception)
- [ ] **Q10** — Hooks de pré-commit (husky + lint-staged) : lint + format auto
- [ ] **Q11** — Aligner les noms de paths : URL publique est `/produits/:slug` (français), code parle parfois de `slug` ou `handle` — uniformiser

---

## 🔴 Performance / SEO (bloquants UX)

- [~] **P1** — 6 images converties en WebP via `apps/web/scripts/compress-images.ts` (sharp, qualité 72, max width 1440px) : `verger-pommiers` 258 Ko, `recolte-sol` 232 Ko, `camion-livraison` 241 Ko (objectif < 200 Ko atteint approximativement) ; `verger-allee2` 344 Ko, `sacs-recolte` 409 Ko, `filets-recolte` 624 Ko (au-dessus de 200 Ko, à recompresser si nécessaire — images très détaillées). Gain global -73 % (7.8 Mo → 2.1 Mo). Imports `.jpg` → `.webp` mis à jour dans `HeroSection.tsx` et `GallerySection.tsx`. Fichiers .jpg sources supprimés.
- [ ] **P2** — Préload du hero (`verger-pommiers.jpg`) avec `<link rel="preload" as="image">` + `fetchpriority="high"`
- [ ] **P3** — `loading="lazy"` sur toutes les images du carousel galerie (hors hero). `ProductCard` déjà OK ✅
- [x] **P4** — `React.lazy()` + `<Suspense>` sur les 9 pages dans `App.tsx` + `PageLoader.tsx` extrait du pattern `PrivateRoute`. **Bundle principal : 885 Ko / 278 Ko gzip → 335 Ko / 108 Ko gzip** (-62%). Pages admin (ProductForm 348 Ko avec TipTap) sorties du bundle public. Warning Vite "chunk > 500 kB" disparu.
- [~] **P5** — OG image : balise `<meta og:image>` posée dynamiquement par `<SEO>` (point vers `/og-image.jpg`). **À créer** : le vrai fichier `apps/web/public/og-image.jpg` (1200×630 px) avec branding Pom'Pom
- [x] **P6** — `<link rel="canonical">` + `og:url` posés dynamiquement par `<SEO>` à partir de `VITE_PUBLIC_SITE_URL`
- [x] **P7** — `<html lang="en">` → `<html lang="fr">` corrigé dans `apps/web/index.html`
- [x] **SEO** — `react-helmet-async` + `<SEO>` réutilisable + JSON-LD Organization (home) + JSON-LD Product (fiche produit) + noindex sur `/admin/*` + `<title>` dynamique par page
- [x] **Sitemap** — Endpoint Fastify `GET /sitemap.xml` qui liste home + contact + produits publiés (avec lastmod, changefreq, priority). Proxifié en dev via Vite, à exposer via Caddy en prod
- [x] **Robots.txt** — `Disallow: /admin/` + référence au Sitemap. **À adapter** au domaine final (actuellement en dur `https://pompom.fr/sitemap.xml`)

## 🟠 Performance / SEO

- [x] **P8** — `sitemap.xml` dynamique (route Fastify, généré à la volée depuis la DB)
- [x] **P9** — `public/robots.txt` simplifié
- [x] **P10** — Asset orphelin `hero-juice.jpg` déjà absent du disque + aucun import.
- [ ] **P11** — Audit Lighthouse final avant MEP (cible : Performance > 80, SEO > 95, Accessibilité > 90)

---

## 🟠 Accessibilité (a11y)

- [x] **A1** — `HeroSection.tsx:23-27` utilise un `<a class="...">` direct, plus de `<button>` imbriqué.
- [ ] **A2** — Ajouter skip link « Aller au contenu principal » en début de body
- [x] **A3** — `aria-label` sur boutons icônes-seules dans l'admin (modifier, supprimer, supprimer image, etc.) — déjà fait dans `Products.tsx` et `ProductForm.tsx`
- [ ] **A4** — Vérifier contrastes Tailwind avec axe DevTools (WCAG AA)
- [ ] **A5** — Navigation clavier complète (Tab, Enter, Esc) testée sur toutes les pages
- [ ] **A6** — Focus visible sur tous les éléments interactifs (`focus-visible:ring`)

---

## 🔴 Données / contenu (bloquants MEP)

- [x] **D1** — Formulaire de contact branché à **Resend** : nouvelle route `POST /api/contact` (Fastify) + service `email.service.ts` (sanitize HTML anti-injection) + `Contact.tsx` appelle `api()` avec gestion erreur (toast destructive). Tests : 7 nouveaux côté API + 4 mis à jour côté web. Variables d'env : `RESEND_API_KEY` (requis-prod), `CONTACT_EMAIL_TO`, `CONTACT_EMAIL_FROM` (cf. `.env.example` et docker-compose).
- [ ] **D2** — Corriger les coordonnées GPS Google Maps dans `Contact.tsx` (actuellement génériques, pas la vraie adresse 592 Lanvaon, Plouguerneau)
- [x] **D3** — Copyright footer dynamique `© {new Date().getFullYear()}` (cf. `Index.tsx`)
- [ ] **D4** — Vérifier toutes les coordonnées du site (téléphone, email, adresse) — confirmation client requise
- [ ] **D5** — Aligner le champ formulaire Contact « phone » → ou clarifier le besoin (sujet ?) — divergence brief/code

---

## 🔴 Légal — e-commerce / vitrine FR (bloquants MEP)

- [~] **L1** — Page `/mentions-legales` créée (`MentionsLegales.tsx`) avec rubriques éditeur, directeur de publication, hébergeur (OVH par défaut), propriété intellectuelle, crédits, données personnelles, contact. **Placeholders `[À COMPLÉTER]` à remplir** : SIRET, raison sociale, forme juridique, TVA, directeur de publication, crédit photo, agence/dev. Lien dans `PublicFooter`, entrée sitemap, test rendu vert (3 tests).
- [~] **L2** — Page `/confidentialite` créée (`Confidentialite.tsx`) avec rubriques RGPD complètes (préambule, responsable, données collectées, finalité, base légale, durée, destinataires Resend, droits, DPO, cookies, sécurité, modifications). **Placeholders `[À COMPLÉTER]` à remplir** : durée de conservation, DPO, raison sociale, responsable des réponses. Lien dans `PublicFooter`, entrée sitemap, test rendu vert (3 tests).
- [ ] **L3** — **Bannière cookies** si analytics ajoutées plus tard (Axeptio / Tarteaucitron / custom)
- [ ] **L4** — Si vente ajoutée plus tard : CGV obligatoires (rétractation 14j, prix, délais, retours)

---

## 🔴 Infra / déploiement OVH (bloquants MEP)

- [ ] **I1** — Acheter / configurer domaine + DNS (pointer A record vers IP VPS OVH)
- [ ] **I2** — Provisionner VPS OVH (recommandation : VPS Comfort minimum, Debian 12 ou Ubuntu 24.04)
- [ ] **I3** — Reverse proxy HTTPS (Caddy recommandé : Let's Encrypt auto, config 10 lignes — cf. README § Déploiement OVH)
- [ ] **I4** — Installation Docker + Docker Compose sur le VPS
- [ ] **I5** — Volume persistant pour `apps/api/uploads/` (volume nommé Docker `uploads` déjà défini dans `docker-compose.prod.yml`)
- [x] **I6** — Volume persistant pour PostgreSQL (`pgdata` défini dans `docker-compose.prod.yml`)
- [ ] **I7** — Variables d'env de prod dans `.env` sur le VPS (jamais committé, cf. `.env.example` à la racine)
- [x] **I8** — Migration Prisma au démarrage de prod (`prisma migrate deploy` lancé via `command:` du service api dans `docker-compose.prod.yml`)
- [ ] **I9** — Seed admin initial sur le VPS (à exécuter manuellement : `docker compose exec api bun run prisma:seed`)
- [~] **I10** — `.github/workflows/ci.yml` créé avec 2 jobs parallèles : `api` (service Postgres 16-alpine port 5433, `bun install` → `prisma:generate` → tests vitest → `tsc build`) et `web` (`bun install` → tests vitest → `tsc + vite build`). Trigger : `pull_request` + `push` sur `main`/`develop`. **Lint volontairement exclu** : `apps/api` n'a pas de `eslint.config.js` et `apps/web` a 2 erreurs préexistantes (`textarea.tsx` empty interface, `tailwind.config.ts` require) — à régler dans Q8. **À valider** : pousser sur GitHub et observer le premier run.

## 🟠 Infra

- [ ] **I11** — Monitoring erreurs : Sentry (free tier suffit)
- [ ] **I12** — Analytics conformes RGPD : Plausible (auto-hébergé sur le VPS ou plausible.io)
- [ ] **I13** — Backup DB cron quotidien + offsite (rsync vers Backblaze B2 ou OVH Object Storage)
- [x] **I14** — Health check endpoint `GET /health` côté API (cf. `app.ts`)
- [x] **I15** — Logs structurés (pino JSON en prod, pino-pretty en dev) — déjà configuré dans `app.ts`. Reste à ajouter rotation logrotate sur le VPS.

---

## 🟠 UX / responsive

- [ ] **U1** — Page 404 (`apps/web/src/pages/NotFound.tsx`) — design plus soigné, lien retour accueil
- [ ] **U2** — États de chargement : skeleton sur la liste produits (pas spinner)
- [x] **U3** — État vide explicite si aucun produit publié (déjà dans `Index.tsx`)
- [ ] **U4** — Message d'erreur réseau explicite si l'API est indisponible (errorBoundary)
- [ ] **U5** — Favicon Pom'Pom custom (remplacer `public/favicon.ico` Vite par défaut)
- [ ] **U6** — Tester responsive sur iPhone SE (375px), iPad (768px), desktop 1440px et 1920px

---

## 📌 Notes de déploiement VPS OVH

**Stack cible** : 1 VPS, Docker Compose, 3 containers (db / api / web), reverse proxy Caddy en host (hors Compose).

**Recommandation reverse proxy : Caddy** — configuration ultra-courte, HTTPS automatique Let's Encrypt, parfait pour VPS solo.

```
# /etc/caddy/Caddyfile (sur le VPS)
pompom.fr {
    reverse_proxy localhost:5173  # web (nginx serving dist/)
}
api.pompom.fr {
    reverse_proxy localhost:3001  # api Fastify
}
```

**Commandes déploiement initial** :
```bash
git clone <repo> /opt/pompom && cd /opt/pompom
cp .env.example .env  # remplir POSTGRES_*, JWT_SECRET, CORS_ORIGIN, VITE_API_URL, ADMIN_*
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api bun run prisma:seed
```

---

## 📈 Récapitulatif d'avancement

| Catégorie | Total | Faits | Restants 🔴 bloquants | Restants 🟠+🟡 |
|---|---:|---:|---:|---:|
| Refonte technique | 22 | 22 | 0 | 0 |
| Sécurité | 16 | 6 | 6 | 4 |
| Qualité code | 11 | 3 | 5 | 3 |
| Perf / SEO | 11 | 2 | 5 | 4 |
| Accessibilité | 6 | 1 | 0 | 5 |
| Données / contenu | 5 | 1 | 3 | 1 |
| Légal | 4 | 0 | 4 | 0 |
| Infra OVH | 15 | 4 | 9 | 2 |
| UX | 6 | 1 | 0 | 5 |
| Tests | 4 | 0 | 0 | 4 |
| **TOTAL** | **100** | **40** | **32** 🔴 | **28** 🟠+🟡 |

**Verdict** : la base technique est prête (code + tests + Docker). Il reste **32 bloquants MEP** à traiter, dont les plus critiques sont les **pages légales** (L1, L2), le **branchement réel du formulaire de contact** (D1), la **provision VPS OVH + HTTPS** (I1-I4, I7) et la **purge du token Shopify de l'historique git** (S1).
