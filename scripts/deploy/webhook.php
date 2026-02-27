<?php
/**
 * GitHub Webhook Listener — csmgfoot
 *
 * Ce fichier doit être placé MANUELLEMENT sur le serveur dans :
 *   /home/csmgfo86/public_html/webhook.php
 *
 * Il n'est PAS dans le git (voir .gitignore) car il contient un secret.
 *
 * Sur GitHub, configurer le webhook :
 *   URL    : https://csmgfoot.fr/webhook.php
 *   Secret : (une chaîne aléatoire que vous choisissez)
 *   Events : Just the push event
 *
 * Sur le serveur, créer /home/csmgfo86/.webhook_secret avec votre secret
 */

// ─── SÉCURITÉ : Vérification de la signature GitHub ─────────────────────────
$secret_file = '/home/csmgfo86/.webhook_secret';

if (!file_exists($secret_file)) {
    http_response_code(500);
    die('Configuration manquante : .webhook_secret introuvable');
}

$secret = trim(file_get_contents($secret_file));
$payload = file_get_contents('php://input');
$signature_header = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (empty($signature_header)) {
    http_response_code(401);
    die('Signature manquante');
}

$expected_signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

if (!hash_equals($expected_signature, $signature_header)) {
    http_response_code(403);
    die('Signature invalide');
}
// ────────────────────────────────────────────────────────────────────────────

// Vérifier que c'est un push sur main
$data = json_decode($payload, true);
$ref  = $data['ref'] ?? '';

if ($ref !== 'refs/heads/main') {
    http_response_code(200);
    die("Push ignoré (branche: $ref, seul main est déployé)");
}

// Lancer le script de déploiement en arrière-plan
$deploy_script = '/home/csmgfo86/repositories/csmgfoot/scripts/deploy/deploy.sh';
$log_file      = '/home/csmgfo86/logs/deploy.log';

if (!file_exists($deploy_script)) {
    http_response_code(500);
    die("Script de déploiement introuvable : $deploy_script");
}

// Exécution asynchrone (le webhook répond immédiatement à GitHub)
$command = "bash $deploy_script >> $log_file 2>&1 &";
exec($command);

http_response_code(200);
echo json_encode([
    'status'  => 'ok',
    'message' => 'Déploiement lancé en arrière-plan',
    'commit'  => substr($data['after'] ?? '', 0, 7),
    'pusher'  => $data['pusher']['name'] ?? 'unknown',
]);
