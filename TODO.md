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

| Fichier                          | Tests | Couvre                                                      |
| -------------------------------- | ----: | ----------------------------------------------------------- |
| `lib/slug.test.ts`               |     5 | Slugify (accents, longueur, edge cases)                     |
| `lib/auth.test.ts`               |     8 | hashPassword, verifyPassword, signToken, verifyToken        |
| `auth.routes.test.ts`            |     9 | login OK/KO, logout, GET /me, cookie httpOnly               |
| `products.public.routes.test.ts` |     6 | GET list (published only), GET by slug, 404                 |
| `products.admin.routes.test.ts`  |    11 | CRUD avec auth, slug auto, validation zod, sanitize         |
| `images.admin.routes.test.ts`    |     9 | Upload multipart, MIME, taille, delete, fichier physique    |
| `sanitize.test.ts`               |     4 | sanitize-html (script retiré, href javascript bloqué, etc.) |

### Frontend admin + infra (`apps/web/src/tests/` — 39 + 1 skip)

| Fichier                         |      Tests | Couvre                                          |
| ------------------------------- | ---------: | ----------------------------------------------- |
| `api.test.ts`                   |          7 | client fetch, FormData, 204, 401, 500           |
| `AuthContext.test.tsx`          |          6 | loading, /me, login, logout                     |
| `PrivateRoute.test.tsx`         |          3 | loader, redirect, children                      |
| `admin/Login.test.tsx`          |          5 | validation, redirect state.from, toast 401      |
| `admin/Products.test.tsx`       |          6 | liste, badges, modifier, supprimer, déconnexion |
| `admin/ProductForm.test.tsx`    |          8 | création + édition + upload + delete image      |
| `admin/RichTextEditor.test.tsx` | 5 (1 skip) | toolbar, état actif (1 skip TipTap-jsdom)       |

### Frontend public (`apps/web/src/tests/public/` — 31)

| Fichier                  | Tests | Couvre                                                                           |
| ------------------------ | ----: | -------------------------------------------------------------------------------- |
| `Index.test.tsx`         |    12 | header, hero CTA, sections statiques, carousel, états produits, footer dynamique |
| `ProductDetail.test.tsx` |     8 | loader, 404, description HTML, gallery thumbnails, fallback no-image             |
| `ProductCard.test.tsx`   |     5 | image lazy + alt, lien, **assertion négative pas de prix/panier**                |
| `Contact.test.tsx`       |     3 | rendu, validation zod, comportement buggué actuel (`console.log`) — cf. **D1**   |
| `NotFound.test.tsx`      |     3 | 404, lien retour, `console.error` au mount — cf. **Q6**                          |

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
- [x] **S10** — Step `bun audit --audit-level=high` ajouté aux 2 jobs CI (api + web), avec `continue-on-error: true` pour ne pas bloquer le merge sur une vuln tierce non patchable immédiatement. Sortie visible dans les logs GH Actions.

## 🟠 Sécurité (post-MEP)

- [ ] **S11** — HTTPS obligatoire (Caddy/Traefik en reverse proxy sur VPS OVH)
- [ ] **S12** — Logs ne doivent jamais contenir passwords, tokens, données de cartes
- [x] **S13** — Sanitization HTML de la description produit côté API (sanitize-html dans `product.service.ts`) — couvert par 4 tests
- [N/A] **S14** — Backup auto DB Postgres : non prioritaire pour le moment (volume data très faible : produits + 1 admin). À planifier si activité significative ou avant qu'un volume métier critique s'accumule.
- [x] **S15** — `Fastify({ bodyLimit: 256 * 1024 })` dans `app.ts`. JSON > 256 Ko → 413 Payload Too Large. Multipart conserve sa propre limite de 5 Mo (uploads images).
- [x] **S16** — CSP en place : front via `nginx.conf` (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-src https://www.google.com; frame-ancestors 'none'; object-src 'none'`), API via helmet `contentSecurityPolicy` activé en `production` uniquement (default-src 'none'). Dev reste off pour HMR Vite. **À tester en smoke après MEP** : aucune violation dans la console DevTools sur /, /contact (Google Map), /admin/login.

---

## 🔴 Qualité code (bloquants techniques)

- [x] **Q1** — `strict: true` + `noImplicitAny: true` + `noFallthroughCasesInSwitch: true` activés dans `apps/web/tsconfig.app.json`. Code déjà compatible — 3 erreurs révélées au build (1 introduite par P2 sur `fetchpriority` lowercase, 2 imports inutilisés dans des tests) corrigées immédiatement.
- [x] **Q2** — `noUnusedLocals: true` + `noUnusedParameters: true` activés dans `apps/web/tsconfig.app.json` en même temps que Q1.
- [x] **Q3** — `allowJs` absent de `apps/web/tsconfig.app.json` (donc `false` par défaut). Rien à faire.
- [x] **Q4** — `.prettierrc` + `.prettierignore` racine. Config : `printWidth: 100, tabWidth: 2, semi: true, singleQuote: false, trailingComma: 'all', arrowParens: 'always'`. Scripts `format` + `format:check` ajoutés. Run global appliqué (commit massif attendu lors du push). Tous tests verts + lint propre après reformatage.
- [x] **Q5** — Renommer projet : `package.json` racine `pompom-shop`, version `1.0.0`
- [x] **Q6** — Tous les `console.log`/`console.error` résiduels retirés : `Contact.tsx` (via D1) + `NotFound.tsx` (via Q6/U1, useEffect bugué retiré). Test `appelle console.error au montage` supprimé du fichier de test.
- [x] **Q7** — Supprimé texte Lovable visible dans `Index.tsx` (« Propriétaire : Dites-moi quel produit... »)

## 🟠 Qualité code

- [x] **Q8** — Lint propre des 2 côtés : 2 erreurs préexistantes web fixées (`textarea.tsx` interface vide → type alias, `tailwind.config.ts` require → import ES) + `apps/api/eslint.config.js` créé (flat config v9, TS strict, env Node, ignores `dist`/`prisma/migrations`). Steps `Lint` ajoutés aux 2 jobs du workflow CI (entre install/prisma:generate et tests). 7 warnings `react-refresh` shadcn assumés (composants UI exportent un helper à côté — connu). Restent à activer `no-unused-vars: error` strict si voulu.
- [x] **Q9** — `apps/api` est en `strict: true` sans `any` non typé (TS strict dès la conception)
- [x] **Q10** — `husky` v9 + `lint-staged` v17 installés. Hook `.husky/pre-commit` lance `bunx lint-staged` qui dispatche : ESLint sur `apps/web/**/*.{ts,tsx,css}` et `apps/api/**/*.ts`, puis Prettier sur tous les fichiers staged. Script `prepare: husky` dans `package.json` racine (s'auto-install au `bun install`).
- [N/A] **Q11** — Faux positif d'audit. Vérifié : aucun `handle` métier ne coexiste avec `slug`. Les seuls usages de `handle` sont des event handlers génériques (`handleSubmit`, `handleLogout`) et la terminologie MSW (`handlers.ts`) — à conserver. L'API et le front utilisent `slug` partout pour l'identifiant produit.

---

## 🔴 Performance / SEO (bloquants UX)

- [~] **P1** — 6 images converties en WebP via `apps/web/scripts/compress-images.ts` (sharp, qualité 72, max width 1440px) : `verger-pommiers` 258 Ko, `recolte-sol` 232 Ko, `camion-livraison` 241 Ko (objectif < 200 Ko atteint approximativement) ; `verger-allee2` 344 Ko, `sacs-recolte` 409 Ko, `filets-recolte` 624 Ko (au-dessus de 200 Ko, à recompresser si nécessaire — images très détaillées). Gain global -73 % (7.8 Mo → 2.1 Mo). Imports `.jpg` → `.webp` mis à jour dans `HeroSection.tsx` et `GallerySection.tsx`. Fichiers .jpg sources supprimés.
- [x] **P2** — Hero préchargé : `<link rel="preload" as="image" fetchPriority="high">` injecté via Helmet dans `HeroSection.tsx` + attribut `fetchPriority="high"` sur le `<img>`. Combinaison qui force le navigateur à le télécharger en Highest Priority pour optimiser le LCP.
- [x] **P3** — `GallerySection.tsx` : `loading={index === 0 ? "eager" : "lazy"}` sur les `<img>` du carousel. La 1re slide (potentiel LCP du carousel) reste eager, les 9 autres deviennent lazy.
- [x] **P4** — `React.lazy()` + `<Suspense>` sur les 9 pages dans `App.tsx` + `PageLoader.tsx` extrait du pattern `PrivateRoute`. **Bundle principal : 885 Ko / 278 Ko gzip → 335 Ko / 108 Ko gzip** (-62%). Pages admin (ProductForm 348 Ko avec TipTap) sorties du bundle public. Warning Vite "chunk > 500 kB" disparu.
- [x] **P5** — OG image : balise `<meta og:image>` posée dynamiquement par `<SEO>` (point vers `/og-image.jpg`) + fichier `apps/web/public/og-image.jpg` (1200×630) généré par `scripts/generate-og-image.ts` (sharp : photo verger + dégradé + branding Pom'Pom). Script `bun run generate:og`. 2 tests (existence + dimensions) dans `og-image.test.ts`.
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
- [x] **A2** — Skip link « Aller au contenu principal » dans `PublicHeader` (visible au focus clavier), ciblant `#main-content`. `<main id="main-content">` ajouté sur Index + id posé sur les `<main>` existants (Contact, ProductDetail, MentionsLegales, Confidentialite). 2 tests dans `Index.test.tsx`.
- [x] **A3** — `aria-label` sur boutons icônes-seules dans l'admin (modifier, supprimer, supprimer image, etc.) — déjà fait dans `Products.tsx` et `ProductForm.tsx`
- [ ] **A4** — Vérifier contrastes Tailwind avec axe DevTools (WCAG AA)
- [ ] **A5** — Navigation clavier complète (Tab, Enter, Esc) testée sur toutes les pages
- [x] **A6** — `focus-visible:ring` ajouté aux interactifs custom qui n'en avaient pas : logo + CTA Hero + ProductCard + liens footer (les `Button` shadcn l'avaient déjà). 2 tests (`Index.test.tsx`, `ProductCard.test.tsx`). Reste A4/A5 à vérifier au navigateur.

---

## 🔴 Données / contenu (bloquants MEP)

- [x] **D1** — Formulaire de contact branché à **Resend** : nouvelle route `POST /api/contact` (Fastify) + service `email.service.ts` (sanitize HTML anti-injection) + `Contact.tsx` appelle `api()` avec gestion erreur (toast destructive). Tests : 7 nouveaux côté API + 4 mis à jour côté web. Variables d'env : `RESEND_API_KEY` (requis-prod), `CONTACT_EMAIL_TO`, `CONTACT_EMAIL_FROM` (cf. `.env.example` et docker-compose).
- [N/A] **D2** — Coordonnées Maps génériques acceptées telles quelles (décision propriétaire). L'adresse précise reste lisible dans le bloc Coordonnées de `Contact.tsx`.
- [x] **D3** — Copyright footer dynamique `© {new Date().getFullYear()}` (cf. `Index.tsx`)
- [ ] **D4** — Vérifier toutes les coordonnées du site (téléphone, email, adresse) — confirmation client requise
- [x] **D5** — Champ `phone` rendu **facultatif** : Zod web (refine accepte chaîne vide), Zod API (`.optional()`), service email (ligne "Téléphone" omise du HTML si vide), label "Téléphone (facultatif)". Le payload nettoie `phone === ''` → omis du body. Tests : +1 web (soumission sans téléphone), +1 API (payload sans phone → 200 + HTML sans "Téléphone").

---

## 🔴 Légal — e-commerce / vitrine FR (bloquants MEP)

- [~] **L1** — Page `/mentions-legales` créée (`MentionsLegales.tsx`) avec rubriques éditeur, directeur de publication, hébergeur (OVH par défaut), propriété intellectuelle, crédits, données personnelles, contact. **Placeholders `[À COMPLÉTER]` à remplir** : SIRET, raison sociale, forme juridique, TVA, directeur de publication, crédit photo, agence/dev. Lien dans `PublicFooter`, entrée sitemap, test rendu vert (3 tests).
- [~] **L2** — Page `/confidentialite` créée (`Confidentialite.tsx`) avec rubriques RGPD complètes (préambule, responsable, données collectées, finalité, base légale, durée, destinataires Resend, droits, DPO, cookies, sécurité, modifications). **Placeholders `[À COMPLÉTER]` à remplir** : durée de conservation, DPO, raison sociale, responsable des réponses. Lien dans `PublicFooter`, entrée sitemap, test rendu vert (3 tests).
- [N/A] **L3** — Bannière cookies : non applicable. Aucune analytics prévue (cf. I12 abandonné). À réévaluer si un jour ajout Plausible/Matomo/GA.
- [N/A] **L4** — CGV : non applicable. Pas de vente en ligne prévue (site vitrine pur). À réévaluer si activation d'un panier.

---

## 🔴 Infra / déploiement OVH (bloquants MEP)

- [ ] **I1** — Acheter / configurer domaine + DNS (pointer A record vers IP VPS OVH)
- [ ] **I2** — Provisionner VPS OVH (recommandation : VPS Comfort minimum, Debian 12 ou Ubuntu 24.04)
- [~] **I3** — Caddy installé + configuré automatiquement par `ansible/setup.yml` (apt repo cloudsmith, Caddyfile templated depuis `ansible/templates/Caddyfile.j2` avec HSTS, reverse proxy front:5173 + api:3001). Let's Encrypt auto. **Exécution effective à faire par l'utilisateur** quand le VPS est provisionné.
- [~] **I4** — Docker installé automatiquement par `ansible/setup.yml` (script officiel get.docker.com, ajout `deploy` au groupe docker, systemd enable). **Exécution effective à faire par l'utilisateur** au premier `ansible-playbook setup.yml`.
- [ ] **I5** — Volume persistant pour `apps/api/uploads/` (volume nommé Docker `uploads` déjà défini dans `docker-compose.prod.yml`)
- [x] **I6** — Volume persistant pour PostgreSQL (`pgdata` défini dans `docker-compose.prod.yml`)
- [ ] **I7** — Variables d'env de prod dans `.env` sur le VPS (jamais committé, cf. `.env.example` à la racine)
- [x] **I8** — Migration Prisma au démarrage de prod (`prisma migrate deploy` lancé via `command:` du service api dans `docker-compose.prod.yml`)
- [ ] **I9** — Seed admin initial sur le VPS (à exécuter manuellement : `docker compose exec api bun run prisma:seed`)
- [x] **I10** — `.github/workflows/ci.yml` opérationnel et **CI vert validé sur GitHub**. 2 jobs parallèles : `api` (service Postgres 16-alpine port 5433, `bun install` → `prisma:generate` → lint → tests vitest → `tsc build`, env vars de test inline car `.env.test` gitignored) et `web` (`bun install` → lint → tests vitest → `tsc + vite build`). Trigger : `pull_request` + `push` sur `main` uniquement (évite double-run PR+push). `concurrency` group annule les runs précédents en cas de re-push. **3e job `deploy` ajouté** (conditionnel `push main` + `needs: [api, web]`) : installe Ansible, configure SSH + Vault, lance `ansible-playbook deploy.yml` → VPS OVH.

## 🟠 Infra

- [N/A] **I11** — Sentry : non retenu. Site vitrine basse fréquentation, l'overhead d'intégration ne se justifie pas. Les erreurs critiques sont visibles via les logs pino.
- [N/A] **I12** — Analytics : non retenu (propriétaire ne souhaite pas de mesure d'audience). Cohérent avec L3 (pas de bannière cookies).
- [N/A] **I13** — Backup offsite : non prioritaire (cohérent avec S14). À revoir si volume métier devient critique.
- [x] **I14** — Health check endpoint `GET /health` côté API (cf. `app.ts`)
- [x] **I15** — Logs structurés (pino JSON en prod, pino-pretty en dev) — déjà configuré dans `app.ts`. Reste à ajouter rotation logrotate sur le VPS.

---

## 🟠 UX / responsive

- [x] **U1** — `NotFound.tsx` refondue : layout cohérent avec les autres pages publiques (`PublicHeader` + `main` centré + `PublicFooter`), icône `FileQuestion` (lucide), `h1 404` + `Button asChild>Link` shadcn. SEO `noindex` préservé. +1 test « inclut PublicHeader + PublicFooter », -1 test obsolète.
- [x] **U2** — Skeleton (grille de 4 cartes `animate-pulse`) à la place du spinner `Loader2` pendant le fetch produits (`ProductsSection.tsx`). Test loader mis à jour dans `Index.test.tsx`.
- [x] **U3** — État vide explicite si aucun produit publié (déjà dans `Index.tsx`)
- [x] **U4** — Message d'erreur réseau explicite + bouton « Réessayer » si l'API est indisponible (`isError` remonté de `useQuery` dans `Index` → branche dédiée dans `ProductsSection`), au lieu du fallback « Pas encore de produits » silencieux. Test erreur 500 réécrit dans `Index.test.tsx`.
- [x] **U5** — `apps/web/public/favicon.svg` custom (9.1K, = logo Pom'Pom). Plus aucun `favicon.ico` Vite par défaut.
- [ ] **U6** — Tester responsive sur iPhone SE (375px), iPad (768px), desktop 1440px et 1920px

---

## 🚀 MEP automatisée — Ansible + GitHub Actions

`ansible/` contient :

- `setup.yml` : provisioning initial (lancé 1× depuis poste local, en root SSH)
- `deploy.yml` : deploy app (lancé par CI sur push `main`, ou en manuel)
- `group_vars/pompom_vps.yml` : vars publiques (paths, repo, domaine)
- `group_vars/pompom_vps_vault.yml.example` : template du Vault chiffré (env prod)
- `templates/Caddyfile.j2` : config reverse proxy templated
- `files/github_deploy_key.example` : placeholder deploy key SSH (vraie clé gitignorée)

Procédure complète documentée dans le `README.md` section « Déploiement automatisé (Ansible + GitHub Actions) ». 3 secrets GH requis : `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `ANSIBLE_VAULT_PASSWORD`.

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

Comptage : **Faits** = items `[x]` (terminés) + `[N/A]` (sans objet). **Restants** = items `[ ]` ou `[~]` (partiels), ventilés par la sévérité de leur section. Les totaux portent sur les items codés (S1-S16, Q1-Q11, etc.).

| Catégorie         |   Total |  Faits | Restants 🔴 bloquants | Restants 🟠+🟡 |
| ----------------- | ------: | -----: | --------------------: | -------------: |
| Refonte technique |      22 |     19 |                     3 |              0 |
| Sécurité          |      16 |     12 |                     2 |              2 |
| Qualité code      |      11 |     11 |                     0 |              0 |
| Perf / SEO        |      11 |      9 |                     1 |              1 |
| Accessibilité     |       6 |      4 |                     0 |              2 |
| Données / contenu |       5 |      4 |                     1 |              0 |
| Légal             |       4 |      2 |                     2 |              0 |
| Infra OVH         |      15 |      8 |                     7 |              0 |
| UX                |       6 |      5 |                     0 |              1 |
| Tests             |       4 |      0 |                     0 |              4 |
| **TOTAL**         | **100** | **74** |             **16** 🔴 |   **10** 🟠+🟡 |

**Verdict** : la base technique est prête (code + tests + Docker + CI verte) et l'essentiel des bloquants logiciels est traité. Restent **16 bloquants MEP**, en grande majorité opérationnels ou liés au contenu plutôt qu'au code :

- **Pages légales** (L1, L2) : remplir les placeholders `[À COMPLÉTER]` (SIRET, raison sociale, DPO, durée de conservation…) — **infos client**.
- **Coordonnées** (D4) : confirmer téléphone / email / adresse — **infos client**.
- **Secrets de prod** : S2 (`JWT_SECRET` aléatoire ≥ 48 chars), S3 (`CORS_ORIGIN` strict).
- **Infra / déploiement OVH** (I1-I5, I7, I9) + **premier démarrage** (`docker compose up`, seed admin, changer `ADMIN_PASSWORD`).
- **Perf** (P1) : recompression optionnelle de 3 images, seulement si l'audit Lighthouse (P11) le réclame.
