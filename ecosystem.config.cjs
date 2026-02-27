// ecosystem.config.cjs — Configuration PM2 pour csmgfoot
// Permet de démarrer/redémarrer l'app Astro SSR avec PM2
//
// Utilisation :
//   pm2 start ecosystem.config.cjs
//   pm2 save          ← pour que PM2 redémarre au reboot du serveur
//   pm2 startup       ← pour activer le démarrage automatique

module.exports = {
  apps: [
    {
      name: 'csmgfoot',

      // Le serveur Node.js généré par le build Astro
      script: '/home/csmgfo86/repositories/csmgfoot/dist/server/entry.mjs',

      // Variables d'environnement de production
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3862, // Port interne (choisir un port libre sur votre serveur)
      },

      // Redémarrage automatique si le process plante
      autorestart: true,
      watch: false,

      // Logs
      out_file: '/home/csmgfo86/logs/csmgfoot-out.log',
      error_file: '/home/csmgfo86/logs/csmgfoot-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Redémarrage si > 500MB RAM utilisée
      max_memory_restart: '500M',
    },
  ],
};
