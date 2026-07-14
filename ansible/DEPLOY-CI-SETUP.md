# Activation du déploiement automatique (GitHub Actions → VPS)

La clé SSH du runner est désormais stockée **dans le Vault chiffré**
(`deploy_ssh_private_key`). Il ne reste donc **qu'UNE action admin** pour activer
le déploiement auto : poser le secret `ANSIBLE_VAULT_PASSWORD`.

---

## 1. LE seul secret à poser (admin)

`Settings` → `Secrets and variables` → `Actions` :

| Secret                   | Valeur                                         | Action            |
| ------------------------ | ---------------------------------------------- | ----------------- |
| `ANSIBLE_VAULT_PASSWORD` | le mot de passe du Vault (communiqué en privé) | **Mettre à jour** |

```bash
# nécessite un compte admin du repo
printf '%s' '<mot-de-passe-vault>' | gh secret set ANSIBLE_VAULT_PASSWORD --repo stephpom/happy-apple-shop
```

Les secrets **`DEPLOY_SSH_KEY`** et **`DEPLOY_HOST`** ne sont **plus utilisés**
(la clé vient du Vault, l'IP est dans l'inventaire) → tu peux les **supprimer**.

---

## 2. Déjà fait (automatisé), pour info

- **Clé SSH runner** : clé **privée** dans le Vault (`deploy_ssh_private_key`), clé
  **publique** installée dans `~deploy/.ssh/authorized_keys` du VPS **et** dans
  `group_vars/pompom_vps.yml` (`deploy_authorized_key`, réinstallée par `setup.yml`).
- **Utilisateur `deploy`** : membre du groupe `docker`, propriétaire de `/opt/pompom`,
  accès `git pull` GitHub (clé de déploiement en place).
- **`deploy.yml`** : une play `localhost` matérialise la clé depuis le Vault vers
  `~/.ssh/deploy_key`, puis la play principale déploie (sans `become`, via le groupe docker).
- **`ci.yml`** : plus de secret SSH ; `ANSIBLE_VAULT_PASSWORD` suffit.

---

## 3. Rotation de la clé Resend (sécurité — à faire)

L'ancienne clé Resend a fuité dans l'historique git → **la révoquer**.

1. [resend.com/api-keys](https://resend.com/api-keys) → supprimer `re_Zd5y…`, en créer une nouvelle.
2. La mettre dans le Vault :
   ```bash
   ansible-vault edit ansible/group_vars/pompom_vps_vault.yml --vault-password-file .vault_password
   # remplacer la ligne RESEND_API_KEY=... dans env_production
   git add ansible/group_vars/pompom_vps_vault.yml && git commit -m "chore: rotation cle Resend" && git push
   ```

---

## 4. Vérifier

Une fois §1 fait : `Actions` → dernier run → **Re-run failed jobs** (ou pousser sur `main`).
Le job `deploy` doit : déchiffrer le Vault → matérialiser la clé → se connecter en
`deploy@VPS` → `git pull` + réécrire `.env` (valeurs déjà fonctionnelles) →
`docker compose up -d --build` + `prisma migrate deploy` (idempotents) → health check.

---

## Déploiement manuel (local)

Le fichier `.vault_password` (racine, **gitignoré**) contient le mot de passe du Vault :

```bash
ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i ansible/inventory.yml ansible/deploy.yml \
  --private-key ~/.ssh/deploy_key \
  --vault-password-file .vault_password
# (~/.ssh/deploy_key est créé automatiquement par le playbook depuis le Vault)
```
