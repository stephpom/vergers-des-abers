# Activation du déploiement automatique (GitHub Actions → VPS)

Guide **admin** pour rendre le job `deploy` de `.github/workflows/ci.yml` opérationnel.
Prérequis : être **admin** du repo `stephpom/happy-apple-shop` (les secrets Actions
exigent le rôle admin) et avoir un accès SSH au VPS.

Le code est déjà prêt (vault chiffré committé, inventaire, `setup.yml`). Il reste
**3 secrets GitHub** + **1 clé SSH de déploiement** + la **rotation de la clé Resend**.

---

## 1. Secrets GitHub Actions

`Settings` → `Secrets and variables` → `Actions` → onglet **Secrets**.

| Secret                   | Valeur                                          | Action                       |
| ------------------------ | ----------------------------------------------- | ---------------------------- |
| `ANSIBLE_VAULT_PASSWORD` | le mot de passe du Vault (communiqué hors-repo) | **Mettre à jour**            |
| `DEPLOY_HOST`            | `51.210.45.183`                                 | Vérifier / **mettre à jour** |
| `DEPLOY_SSH_KEY`         | clé **privée** du runner (voir §2)              | **Mettre à jour**            |

En UI : `New repository secret` (ou l'éditer s'il existe) → coller la valeur → `Add secret`.

Équivalent CLI (nécessite un compte **admin** ; `gh auth switch` si besoin) :

```bash
printf '%s' '<mot-de-passe-vault>' | gh secret set ANSIBLE_VAULT_PASSWORD --repo stephpom/happy-apple-shop
printf '%s' '51.210.45.183'        | gh secret set DEPLOY_HOST          --repo stephpom/happy-apple-shop
gh secret set DEPLOY_SSH_KEY --repo stephpom/happy-apple-shop < ~/.ssh/pompom_ci_deploy
```

---

## 2. Clé SSH de déploiement (runner CI → `deploy@VPS`)

Le job CI se connecte au VPS en tant qu'utilisateur `deploy`. Il faut une paire de clés
dédiée dont la **publique** est autorisée sur le VPS et la **privée** dans `DEPLOY_SSH_KEY`.

```bash
# a) Générer une paire dédiée (sans passphrase, pour l'automatisation)
ssh-keygen -t ed25519 -f ~/.ssh/pompom_ci_deploy -C "github-actions-pompom" -N ""

# b) Autoriser la clé publique sur le VPS pour l'utilisateur deploy
PUB=$(cat ~/.ssh/pompom_ci_deploy.pub)
ssh -i ~/.ssh/id_pompom ubuntu@51.210.45.183 "sudo install -d -m700 -o deploy -g deploy /home/deploy/.ssh && \
  echo '$PUB' | sudo tee -a /home/deploy/.ssh/authorized_keys >/dev/null && \
  sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys && sudo chmod 600 /home/deploy/.ssh/authorized_keys"

# c) Poser la clé PRIVÉE dans le secret DEPLOY_SSH_KEY (cf. §1)
gh secret set DEPLOY_SSH_KEY --repo stephpom/happy-apple-shop < ~/.ssh/pompom_ci_deploy
```

**IaC (recommandé)** : coller le contenu de `~/.ssh/pompom_ci_deploy.pub` dans
`ansible/group_vars/pompom_vps.yml` → `deploy_authorized_key: "ssh-ed25519 AAAA… github-actions-pompom"`,
puis commit. Ainsi un futur `setup.yml` réinstalle la clé automatiquement (étape b intégrée).

---

## 3. Rotation de la clé Resend (sécurité)

L'ancienne clé Resend a été committée en clair dans l'historique git → **la révoquer**.

1. [resend.com/api-keys](https://resend.com/api-keys) → supprimer l'ancienne clé `re_Zd5y…`.
2. Créer une nouvelle clé.
3. La mettre dans le Vault (elle ne vit QUE là désormais) :
   ```bash
   ansible-vault edit ansible/group_vars/pompom_vps_vault.yml   # demande le mot de passe du Vault
   # remplacer la ligne RESEND_API_KEY=...
   git add ansible/group_vars/pompom_vps_vault.yml && git commit -m "chore: rotation cle Resend" && git push
   ```

---

## 4. Vérifier

Une fois §1 et §2 faits, relancer le dernier run échoué (`Actions` → run → `Re-run failed jobs`)
ou pousser un commit sur `main`. Le job `deploy` doit :

1. déchiffrer le Vault (secret `ANSIBLE_VAULT_PASSWORD` correct) ;
2. se connecter en `deploy@VPS` (clé OK) ;
3. `git pull` + réécrire `/opt/pompom/.env` **depuis le Vault** (valeurs déjà fonctionnelles → pas de casse) ;
4. `docker compose up -d --build` + `prisma migrate deploy` (idempotent) + health check.

> ⚠️ Tant que `ANSIBLE_VAULT_PASSWORD` n'est pas mis à jour avec le **nouveau** mot de passe,
> le job échoue en `Decryption failed` — c'est attendu.
