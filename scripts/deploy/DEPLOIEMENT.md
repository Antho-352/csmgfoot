# Guide de déploiement — CSMG Foot

## Architecture

```
GitHub push → Webhook GitHub → /home/csmgfo86/public_html/webhook.php
                                      ↓
                          scripts/deploy/deploy.sh
                                      ↓
                    git pull + npm install + npm run build
                                      ↓
                    rsync dist/client/ → public_html/ (sans /blog)
                                      ↓
                              pm2 restart csmgfoot
```

Le serveur Node.js (PM2, port 3862) sert le site Astro SSR.
Apache est configuré en reverse proxy vers ce port.

---

## Installation sur le serveur (à faire UNE SEULE FOIS)

### 1. Connexion SSH
```bash
ssh csmgfo86@csmgfoot.fr
```

### 2. Vérifier Node.js / npm
```bash
node -v   # doit afficher v18+ ou v20+
npm -v
```
> Si introuvable, activer Node.js dans **cPanel → NodeJS Selector**

### 3. Installer PM2 globalement
```bash
npm install -g pm2
```

### 4. S'assurer que le repo est à jour
```bash
cd ~/repositories/csmgfoot
git pull origin main
```

### 5. Créer le fichier .env de production
```bash
cat > ~/repositories/csmgfoot/.env << 'EOF'
VITE_WP_API_URL=https://csmgfoot.fr/blog/wp-json/wp/v2
VITE_SITE_URL=https://csmgfoot.fr
VITE_WEB3FORMS_KEY=VOTRE_CLE_WEB3FORMS
EOF
```

### 6. Rendre le script de déploiement exécutable
```bash
chmod +x ~/repositories/csmgfoot/scripts/deploy/deploy.sh
```

### 7. Générer un secret pour le webhook
```bash
openssl rand -hex 32 > ~/.webhook_secret
cat ~/.webhook_secret   # ← copier cette valeur pour GitHub
```

### 8. Copier le webhook.php dans public_html
```bash
cp ~/repositories/csmgfoot/scripts/deploy/webhook.php ~/public_html/webhook.php
```

### 9. Protéger webhook.php des lectures directes
Dans `~/public_html/.htaccess`, ajouter :
```apache
# Bloquer l'accès direct au webhook (optionnel, la signature suffit)
<Files "webhook.php">
  # Tout le monde peut POST (GitHub le fait), mais on bloque GET
</Files>
```

### 10. Premier déploiement manuel
```bash
bash ~/repositories/csmgfoot/scripts/deploy/deploy.sh
```

### 11. Démarrer PM2 (si premier démarrage)
```bash
cd ~/repositories/csmgfoot
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # ← copier-coller la commande qu'il affiche (avec sudo)
```

---

## Configuration GitHub Webhook

1. Aller sur : https://github.com/Antho-352/csmgfoot/settings/hooks
2. Cliquer **Add webhook**
3. Remplir :
   - **Payload URL** : `https://csmgfoot.fr/webhook.php`
   - **Content type** : `application/json`
   - **Secret** : (le contenu de `~/.webhook_secret` sur le serveur)
   - **Which events** : `Just the push event`
4. Cliquer **Add webhook**

---

## Configuration Apache (reverse proxy vers Node.js)

Dans **cPanel → Zone Editor** ou via SSH, dans le VirtualHost de csmgfoot.fr :

```apache
# Ajouter dans le VirtualHost de csmgfoot.fr
ProxyPass /blog !          # ← exclure WordPress
ProxyPass / http://127.0.0.1:3862/
ProxyPassReverse / http://127.0.0.1:3862/
```

> Sur WHM : **WHM → Apache Configuration → Include Editor** → Before VirtualHosts

---

## Commandes utiles

```bash
# Voir les logs de déploiement
tail -f ~/logs/deploy.log

# Voir l'état PM2
pm2 status

# Voir les logs du serveur Node.js
pm2 logs csmgfoot

# Déployer manuellement
bash ~/repositories/csmgfoot/scripts/deploy/deploy.sh

# Redémarrer le serveur
pm2 restart csmgfoot
```

---

## Workflow quotidien (après installation)

```
# Sur votre Mac :
git add .
git commit -m "mon changement"
git push

# → GitHub déclenche le webhook
# → Le serveur pull, build, déploie automatiquement
# → Vérifier : tail -f ~/logs/deploy.log
```
