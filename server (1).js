'use strict';
/**
 * server.js — point d'entrée : serveur web (Render), ping anti-sommeil toutes les 10 min,
 * démarrage du bot Telegram et restauration des sessions WhatsApp.
 *
 * Variables d'environnement (Render > Environment) :
 *   TELEGRAM_TOKEN       (obligatoire) token donné par @BotFather
 *   RENDER_EXTERNAL_URL  (fournie automatiquement par Render) utilisée pour le ping
 *   BOT_LINK, SUPPORT_LINK, BOT_TZ, MAX_PAIRS_PER_USER, IMG_JEUX  (facultatives)
 */
const express = require('express');
const axios = require('axios');

const storage = require('./Stockage');
const search = require('./Recherche');
const wa = require('./WhatsApp');
const telegram = require('./Telegram');

const PORT = process.env.PORT || 3000;
const PING_EVERY = 10 * 60 * 1000; // 10 minutes
const startedAt = Date.now();

const app = express();

app.get('/', (req, res) => {
  res.send('★ OTAKU ANIME BOT ★ — by Mr Kira Tech 🌐 — en ligne ✅');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round((Date.now() - startedAt) / 1000),
    whatsapp: wa.countConnected(),
    users: storage.countUsers(),
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Serveur] en écoute sur le port ${PORT}`);
  const stats = search.bankStats();
  console.log(`[Base] quizz : ${stats.quizz.total} · devinettes : ${stats.devinettes.total}`);

  telegram.start(wa);
  wa.restoreAll().catch((e) => console.error('[WhatsApp] restauration :', e.message));
});

/* ---------- Anti-sommeil (Render free) : ping toutes les 10 min ---------- */
const selfUrl = (process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${PORT}`).replace(/\/$/, '');
setInterval(() => {
  axios
    .get(`${selfUrl}/health`, { timeout: 15000 })
    .then(() => console.log('[Ping] OK', new Date().toISOString()))
    .catch((e) => console.error('[Ping] échec :', e.message));
}, PING_EVERY);

/* ---------- Sécurité : le bot ne doit jamais s'arrêter sur une erreur ---------- */
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e && e.message ? e.message : e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e && e.message ? e.message : e));

function shutdown() {
  console.log('[Serveur] arrêt…');
  storage.flush();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
