#!/bin/bash
# =============================================================================
# SCRIPT DE DÉPLOIEMENT - csmgfoot
# Appelé par public/webhook.php après un push GitHub
#
# Ce script :
#   1. Pull le dernier code depuis GitHub
#   2. Installe les dépendances npm
#   3. Build le projet Astro
#   4. Copie les fichiers buildés dans public_html SANS toucher /blog
#   5. Redémarre le process PM2
# =============================================================================

set -e  # Arrêter si une commande échoue

# ─── CONFIGURATION ──────────────────────────────────────────────────────────
HOME_DIR="/home/csmgfo86"
REPO_DIR="$HOME_DIR/repositories/csmgfoot"
PUBLIC_HTML="$HOME_DIR/public_html"
LOG_FILE="$HOME_DIR/logs/deploy.log"
PM2_APP_NAME="csmgfoot"
# ────────────────────────────────────────────────────────────────────────────

# Créer le dossier logs si nécessaire
mkdir -p "$HOME_DIR/logs"

# Fonction de log avec timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=============================================="
log " 🚀 DÉPLOIEMENT AUTOMATIQUE - csmgfoot"
log "=============================================="

# Charger nvm si disponible (pour avoir accès à node/npm sur cPanel)
export NVM_DIR="$HOME_DIR/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Vérifier que node est disponible
if ! command -v node &> /dev/null; then
  log "❌ ERREUR : Node.js introuvable. Vérifiez NVM ou le NodeJS Selector cPanel."
  exit 1
fi

log "✅ Node.js $(node -v) / npm $(npm -v)"

# ── ÉTAPE 1 : Git Pull ──────────────────────────────────────────────────────
log ""
log "📥 Étape 1/4 : Git pull..."
cd "$REPO_DIR"
git pull origin main 2>&1 | tee -a "$LOG_FILE"
log "✅ Code mis à jour"

# ── ÉTAPE 2 : npm install ───────────────────────────────────────────────────
log ""
log "📦 Étape 2/4 : Installation des dépendances..."
npm install --silent 2>&1 | tee -a "$LOG_FILE"
log "✅ Dépendances installées"

# ── ÉTAPE 3 : Build Astro ───────────────────────────────────────────────────
log ""
log "🔨 Étape 3/4 : Build Astro..."
npm run build 2>&1 | tee -a "$LOG_FILE"
log "✅ Build terminé"

# ── ÉTAPE 4 : Déploiement vers public_html ──────────────────────────────────
log ""
log "📂 Étape 4/4 : Déploiement vers public_html..."
log "   Source      : $REPO_DIR/dist/client/"
log "   Destination : $PUBLIC_HTML/"
log "   Protégés    : /blog, /.well-known, /cgi-bin"

# rsync copie uniquement les fichiers modifiés
# --exclude protège les dossiers qu'on ne veut PAS écraser
rsync -av --checksum \
  --exclude=/blog \
  --exclude=/.well-known \
  --exclude=/cgi-bin \
  --exclude=/webhook.php \
  "$REPO_DIR/dist/client/" \
  "$PUBLIC_HTML/" \
  2>&1 | tee -a "$LOG_FILE"

log "✅ Fichiers statiques déployés"

# ── ÉTAPE 5 : Redémarrage PM2 ───────────────────────────────────────────────
log ""
log "🔄 Étape 5/5 : Redémarrage du serveur Node.js (PM2)..."

# Vérifier si PM2 est disponible
if command -v pm2 &> /dev/null; then
  # Si le process existe déjà → restart, sinon → start
  if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
    pm2 restart "$PM2_APP_NAME" 2>&1 | tee -a "$LOG_FILE"
    log "✅ Process PM2 '$PM2_APP_NAME' redémarré"
  else
    pm2 start "$REPO_DIR/ecosystem.config.cjs" 2>&1 | tee -a "$LOG_FILE"
    pm2 save
    log "✅ Process PM2 '$PM2_APP_NAME' démarré"
  fi
else
  log "⚠️  PM2 introuvable. Redémarrage manuel requis."
  log "   Commande : pm2 start $REPO_DIR/ecosystem.config.cjs"
fi

log ""
log "=============================================="
log " ✅ DÉPLOIEMENT RÉUSSI - https://csmgfoot.fr"
log "=============================================="
log ""
