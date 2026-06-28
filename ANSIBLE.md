# Guide Ansible — Mise en production de Pom'Pom

Ce document explique **ce qu'est Ansible**, **comment fonctionne la mise en production automatisée** du site, et **les étapes concrètes** pour la mettre en marche la première fois.

Public visé : le propriétaire du projet (qui doit comprendre le flux et fournir les infos / secrets) **et** la personne technique qui exécutera les commandes (le développeur).

---

## 1. Qu'est-ce qu'Ansible (en 3 minutes)

Ansible est un **outil d'automatisation d'infrastructure**. On lui décrit dans un fichier ce qu'on veut sur un serveur (« installer Docker, créer un utilisateur, démarrer Caddy, cloner le code, etc. »), et Ansible se charge de **se connecter en SSH** au serveur et d'exécuter les commandes.

**Analogie** : c'est comme un mode d'emploi très précis, qu'Ansible lit et applique sur le serveur à ta place. Si tu relances le même mode d'emploi 10 fois, Ansible ne refera que ce qui n'est pas déjà fait — c'est **idempotent** (sans effet bord si déjà appliqué).

**Pourquoi on l'utilise ici** :

1. **Reproductibilité** — si le VPS plante ou doit être changé, on relance le playbook et le nouveau serveur est identique à l'ancien en 5 minutes.
2. **Mise en production automatique** — quand le développeur push sur `main`, le serveur est mis à jour tout seul (via GitHub Actions qui appelle Ansible).
3. **Pas de surcoût** — Ansible est gratuit et open-source, GitHub Actions est gratuit dans la limite de 2 000 minutes/mois (largement suffisant).
4. **Sécurité** — les mots de passe sensibles (clé API, base de données, etc.) sont **chiffrés dans le code** via une fonctionnalité d'Ansible appelée **Vault**.

---

## 2. Vue d'ensemble — comment ça marche

```
   ┌─────────────────┐         ┌────────────────┐         ┌──────────────┐
   │  Développeur    │         │   GitHub        │         │  VPS OVH     │
   │  (poste local)  │         │   Actions       │         │  (le serveur)│
   └────────┬────────┘         └────────┬───────┘         └──────┬───────┘
            │                           │                         │
            │  git push main            │                         │
            ├──────────────────────────▶│                         │
            │                           │                         │
            │                           │  1. Tests (CI)          │
            │                           │  ──── verts ✓           │
            │                           │                         │
            │                           │  2. ansible-playbook    │
            │                           │     deploy.yml          │
            │                           ├────── SSH ─────────────▶│
            │                           │                         │  git pull
            │                           │                         │  docker compose up
            │                           │                         │  prisma migrate
            │                           │                         │
            │                           │  3. Health check OK     │
            │                           │◀────────────────────────┤
            │                           │                         │
```

**En une phrase** : `git push origin main` → les tests automatiques s'exécutent → si verts, Ansible déploie la nouvelle version sur le VPS et vérifie qu'elle répond bien. Aucune intervention manuelle.

---

## 3. Les fichiers Ansible du projet

Dans le dossier `ansible/` du repo :

| Fichier                           | À quoi il sert                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `setup.yml`                       | **Provisioning initial** : installe Docker, Caddy, configure le pare-feu, crée l'utilisateur, etc. Lancé **une seule fois** la première fois.                      |
| `deploy.yml`                      | **Déploiement continu** : récupère la dernière version du code, redémarre les containers, applique les migrations. Lancé automatiquement à chaque push sur `main`. |
| `inventory.yml`                   | Liste des serveurs cibles (ici un seul VPS).                                                                                                                       |
| `group_vars/pompom_vps.yml`       | Variables non sensibles (chemin, domaine, etc.) — visibles en clair.                                                                                               |
| `group_vars/pompom_vps_vault.yml` | Variables **sensibles chiffrées** (mots de passe, clés API).                                                                                                       |
| `templates/Caddyfile.j2`          | Modèle de configuration du serveur web (Caddy) — Ansible remplit le vrai domaine au moment de l'install.                                                           |
| `files/github_deploy_key`         | Clé SSH qui permet au VPS de cloner le repo depuis GitHub (non commitée).                                                                                          |

---

## 4. Pré-requis avant de lancer la mise en production

Avant d'exécuter quoi que ce soit, tu dois avoir :

### Côté client / propriétaire

- [ ] **Un nom de domaine acheté** (ex. `pompom.fr`) chez OVH ou autre registrar
- [ ] **Les informations légales** pour remplir les pages mentions légales / RGPD (cf. `TODO.md` L1 + L2)
- [ ] **Un compte Resend** ([resend.com](https://resend.com)) pour l'envoi du formulaire de contact + **domaine vérifié** dedans (étape DNS DKIM)

### Côté développeur

- [ ] **Un VPS OVH** provisionné (recommandation : VPS Comfort, Debian 12 ou Ubuntu 24.04), accès **root** en SSH
- [ ] **Le DNS configuré** : un record `A` qui pointe `pompom.fr` (et `*.pompom.fr` ou au minimum `api.pompom.fr`) vers l'IP du VPS
- [ ] **Ansible installé** sur le poste local : `brew install ansible` (macOS) ou équivalent
- [ ] Le repo cloné localement et la branche `ci/ansible-mep` mergée sur `develop`

---

## 5. Setup initial — pas à pas

### Étape 1 — Générer les clés SSH (2 clés différentes)

**Clé n°1 : la « deploy key GitHub »** — utilisée par le VPS pour télécharger le code depuis GitHub.

```bash
ssh-keygen -t ed25519 -f ansible/files/github_deploy_key -C "github-pompom-deploy"
# Entrée → entrée (sans passphrase, pour que ce soit automatique)
```

Ensuite :

1. Ouvre `ansible/files/github_deploy_key.pub` et copie tout le contenu
2. Va sur GitHub → ton repo → **Settings** → **Deploy keys** → **Add deploy key**
3. Colle, donne un titre (ex. « VPS Pompom — read-only »), **laisse "Allow write access" décoché**
4. Valide

**Clé n°2 : la « clé runner »** — utilisée par GitHub Actions pour se connecter au VPS.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/pompom_deploy -C "github-actions-pompom"
# Entrée → entrée
```

La clé publique (`~/.ssh/pompom_deploy.pub`) devra être ajoutée sur le VPS dans le fichier `~deploy/.ssh/authorized_keys` (Ansible le fait automatiquement après le premier provisioning, mais pour le **premier** SSH on utilisera root).

### Étape 2 — Créer et chiffrer le « Vault » (les secrets)

Le Vault contient toutes les valeurs sensibles : mot de passe de la base, clé Resend, mot de passe admin, etc. Il est chiffré avec un mot de passe unique, et seul ce mot de passe permet de le déchiffrer.

```bash
# Copier le template
cp ansible/group_vars/pompom_vps_vault.yml.example ansible/group_vars/pompom_vps_vault.yml

# Éditer pour remplir les vraies valeurs
# (utilise ton éditeur préféré : nano, vim, code, etc.)
nano ansible/group_vars/pompom_vps_vault.yml
```

**Valeurs à remplir** (en remplaçant chaque `CHANGEME_…`) :

- `POSTGRES_PASSWORD` — mot de passe fort généré aléatoirement (ex. `openssl rand -base64 32`)
- `JWT_SECRET` — **obligatoire** ≥ 48 caractères aléatoires (`openssl rand -base64 48`)
- `ADMIN_PASSWORD` — mot de passe pour se connecter à l'interface d'administration `/admin/login`
- `RESEND_API_KEY` — clé API copiée depuis [resend.com/api-keys](https://resend.com/api-keys)
- `CONTACT_EMAIL_TO` — adresse qui reçoit les messages du formulaire de contact (ex. `pom-pom@mailo.com`)
- `CONTACT_EMAIL_FROM` — adresse d'envoi (doit appartenir au domaine vérifié dans Resend, ex. `contact@pompom.fr`)

**Une fois rempli, chiffrer le fichier** :

```bash
ansible-vault encrypt ansible/group_vars/pompom_vps_vault.yml
# → demande un mot de passe : choisis-en un fort, NOTE-LE quelque part de sûr,
#   il sera demandé à chaque lecture du fichier et stocké dans les secrets GitHub
```

Désormais le fichier est illisible sans le mot de passe. C'est ce fichier chiffré qui sera commité.

**Pour le rééditer plus tard** :

```bash
ansible-vault edit ansible/group_vars/pompom_vps_vault.yml
# → entre le mot de passe, modifie, sauve, le fichier reste chiffré
```

### Étape 3 — Configurer les secrets côté GitHub

Va dans le repo GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Crée **3 secrets** :

| Nom du secret            | Valeur                                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEPLOY_SSH_KEY`         | Le contenu **complet** du fichier `~/.ssh/pompom_deploy` (la clé privée, **pas** la `.pub`). Ouvre-le avec `cat ~/.ssh/pompom_deploy` et copie-colle. |
| `DEPLOY_HOST`            | L'IP du VPS (ex. `51.210.x.x`) ou le domaine final (ex. `pompom.fr`)                                                                                  |
| `ANSIBLE_VAULT_PASSWORD` | Le mot de passe que tu as choisi à l'étape 2 pour chiffrer le Vault                                                                                   |

Ces secrets sont chiffrés par GitHub, jamais visibles en clair dans les logs.

### Étape 4 — Personnaliser le domaine

Si tu utilises un domaine autre que `pompom.fr` (ex. `pompom-vergers.com`), édite `ansible/group_vars/pompom_vps.yml` :

```yaml
domain: pompom-vergers.com # remplace ici
api_subdomain: api # → api.pompom-vergers.com
```

### Étape 5 — Premier provisioning du VPS

C'est la commande **« installe tout sur le serveur »**. À lancer **une fois** depuis ton poste local, avec accès SSH root au VPS :

```bash
# Depuis la racine du projet
DEPLOY_HOST=<ip-du-vps> ansible-playbook \
  -i ansible/inventory.yml \
  ansible/setup.yml \
  --user root \
  --ask-vault-password

# → te demande le mot de passe du Vault (saisis-le)
# → te demande peut-être le mot de passe root SSH (si pas de clé root configurée)
```

**Ce qui se passe** (environ 3 à 5 minutes) :

1. Mise à jour du système (`apt update`)
2. Création de l'utilisateur `deploy` avec droits Docker
3. Installation de Docker
4. Installation et configuration de Caddy (serveur web HTTPS)
5. Activation du pare-feu UFW (autorise SSH/80/443, bloque le reste)
6. Clonage du repo dans `/opt/pompom`
7. Écriture du fichier `.env` à partir du Vault déchiffré
8. Premier `docker compose up` → build des images, démarrage des services
9. Création des tables en base + seed du compte administrateur
10. Vérification que l'API répond (health check)

À la fin, le site est **en ligne** sur `https://pompom.fr` (Caddy s'occupe automatiquement du certificat SSL Let's Encrypt en quelques secondes après le premier accès).

### Étape 6 — Tester

- Ouvre `https://pompom.fr` → la home doit s'afficher
- Ouvre `https://pompom.fr/admin/login` → connecte-toi avec `ADMIN_EMAIL` / `ADMIN_PASSWORD` du Vault
- Crée un produit avec photo → il doit apparaître sur la home publique
- Envoie un message via le formulaire `/contact` → tu dois le recevoir à `CONTACT_EMAIL_TO`

Si tout est OK, **la mise en production est opérationnelle**. À partir de maintenant, tu n'as plus besoin de toucher au VPS manuellement.

---

## 6. Utilisation au quotidien

### Déploiement automatique (le cas normal)

Tu fais des modifications, tu les testes en local, puis :

```bash
git checkout main
git merge develop          # ou la branche de feature mergée via PR
git push origin main
```

**C'est tout.** GitHub Actions :

1. Lance les tests (jobs `api` + `web` en parallèle)
2. Si verts → lance le job `deploy` qui exécute `ansible-playbook deploy.yml`
3. Le VPS récupère la dernière version, redémarre les containers, applique les nouvelles migrations
4. Vérification finale via health check

Tu peux suivre le déploiement en direct dans l'onglet **Actions** de GitHub.

**Durée typique** : 4-6 minutes du push à la mise en ligne.

### Déploiement manuel (depuis ton poste)

Utile si tu veux déployer sans pousser sur `main` (test exceptionnel, hotfix urgent contournant la PR) :

```bash
DEPLOY_HOST=<ip-du-vps> ansible-playbook \
  -i ansible/inventory.yml \
  ansible/deploy.yml \
  --ask-vault-password
```

Comportement identique à celui lancé par GitHub Actions.

### Rollback (revenir à une version précédente)

Pas de bouton magique. Si un deploy casse la prod :

```bash
ssh deploy@<ip-du-vps>
cd /opt/pompom
git log --oneline -10                   # repérer le dernier SHA stable
git reset --hard <SHA-stable>
docker compose -f docker-compose.prod.yml up -d --build
```

Le site est revenu à l'état précédent en ~30 secondes.

Puis côté GitHub, soit tu fais un `git revert <SHA-cassé>` + push pour aligner le repo, soit tu corriges et tu re-push.

### Modifier les variables de prod (ex. nouvelle clé Resend)

```bash
# 1. Rééditer le Vault
ansible-vault edit ansible/group_vars/pompom_vps_vault.yml

# 2. Committer le fichier chiffré
git add ansible/group_vars/pompom_vps_vault.yml
git commit -m "chore: rotation clé Resend"
git push origin main
# → le job deploy se relance et applique le nouveau .env sur le VPS
```

---

## 7. Sécurité — qui peut quoi

| Acteur                           | Accès                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Toi (dev)**                    | Tu as : la clé privée `~/.ssh/pompom_deploy` (sur ton poste), le mot de passe du Vault, l'accès root SSH initial au VPS. Sans ces 3 choses, tu ne peux rien faire.                                     |
| **GitHub Actions**               | A : la clé privée SSH (en secret), le mot de passe Vault (en secret), accès SSH au VPS en user `deploy` (pas root). Limité aux opérations Docker via `sudo NOPASSWD` restreint à 3 commandes précises. |
| **Le VPS**                       | Ne peut accéder à GitHub qu'en lecture (deploy key sans write access). Peut redémarrer les containers et Caddy via sudo limité. Pas d'accès root pour le user `deploy`.                                |
| **Quelqu'un qui vole le repo**   | Voit le Vault chiffré mais ne peut pas le lire. Pas d'accès au VPS sans la clé SSH.                                                                                                                    |
| **Quelqu'un qui vole ton poste** | A potentiellement accès à tout (clé + mot de passe). → Activer le chiffrement disque (FileVault sur macOS) + verrouillage écran                                                                        |

---

## 8. FAQ / Troubleshooting

### Le déploiement plante en CI avec `Permission denied (publickey)`

La clé SSH n'est pas autorisée sur le VPS pour l'utilisateur `deploy`. Vérifie :

1. Que le contenu de `~/.ssh/pompom_deploy.pub` est bien dans `~deploy/.ssh/authorized_keys` sur le VPS
2. Que le secret GitHub `DEPLOY_SSH_KEY` contient la clé **privée** (pas la `.pub`)

### Le déploiement plante avec `Decryption failed`

Le mot de passe du Vault dans le secret GitHub ne correspond pas au mot de passe utilisé pour chiffrer le fichier. Re-chiffre le Vault avec le bon mot de passe ou modifie le secret GitHub.

### Le site ne répond plus en HTTPS

Caddy renouvelle le certificat tout seul. Si problème :

```bash
ssh deploy@<vps>
sudo systemctl status caddy
sudo journalctl -u caddy -n 50
```

### Je veux ajouter un nouveau secret (ex. une clé Stripe)

1. Édite le Vault : `ansible-vault edit ansible/group_vars/pompom_vps_vault.yml`
2. Ajoute la ligne `STRIPE_KEY=sk_xxx` dans le bloc `env_production`
3. Commit + push → le job deploy regénère le `.env` sur le VPS

### Comment changer le mot de passe admin sans déployer toute l'app ?

L'admin est seedé une seule fois (à la première installation). Pour changer le mot de passe, soit :

- Connecte-toi en admin et utilise une future page « changer mon mot de passe » (à développer)
- Édite la base directement : `docker compose exec db psql -U pompom -d pompom -c "UPDATE \"User\" SET password = '<nouveau-hash-argon2>' WHERE email = 'admin@pompom.fr';"`

### Combien ça coûte par mois ?

- **GitHub Actions** : 0 € (dans la limite de 2 000 min/mois Free, on consomme ~10 min/push, soit ~200 deploys/mois sans dépasser)
- **VPS OVH** : selon ta gamme (VPS Comfort ~12 €/mois, VPS Élite ~30 €/mois)
- **Domaine** : ~10 €/an
- **Resend** : 0 € (100 emails/jour gratuits — largement suffisant pour un formulaire de contact)
- **Ansible** : 0 € (open source)

**Total** : essentiellement le prix du VPS + nom de domaine.

---

## 9. Pour aller plus loin

- **Documentation officielle Ansible** : [docs.ansible.com](https://docs.ansible.com)
- **Documentation Caddy** : [caddyserver.com/docs](https://caddyserver.com/docs)
- **Documentation Resend** : [resend.com/docs](https://resend.com/docs)
- **GitHub Actions Free tier** : [github.com/pricing](https://github.com/pricing)

---

## En cas de doute

Si quelque chose ne va pas, **ne touche pas le VPS à la main**. Note ce que tu observes, regarde les logs (`docker compose logs api`, `journalctl -u caddy`) et reviens vers l'équipe technique avec ces informations.

Le principe d'Ansible : **toute modification passe par le code** (le repo Git), pas par des bidouilles SSH manuelles. Si tu corriges à la main, la prochaine fois qu'Ansible tourne il **écrasera ta correction**.
