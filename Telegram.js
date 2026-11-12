'use strict';
/**
 * Telegram.js — bot Telegram : /start /menu /help /pair /unpair /link /contact /users
 */
const TelegramBot = require('node-telegram-bot-api');
const storage = require('./Stockage');
const search = require('./Recherche');

const { CONFIG, nowStamp } = search;
const { IMAGES, LINKS } = CONFIG;

const MAX_PAIRS = Number(process.env.MAX_PAIRS_PER_USER) || 3;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pre = (s) => `<pre>${esc(s)}</pre>`;

/* =====================================================================
   TEXTES (identiques au cahier des charges)
   ===================================================================== */
const TXT = {
  start: () =>
    `${pre(`════════════════════════════════════
   ✦ ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★ ✦
════════════════════════════════════
CREATOR : ⫸𝐌𝐫 𝐊𝐈𝐑𝐀┃𝗧𝗘𝗖𝗛 🌐⫷`)}
👋 Bienvenue sur Shadow Kira Bot
Rejoins nos canaux &amp; groupes pour continuer.

Tape /menu pour continuer.`,

  menu: () =>
    pre(`━━━━━━━━━━━━━━━━━━━
★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★
⚜️ Auteur : Mr Kira Tech 🌐
🔗 Lien : ${CONFIG.BOT_LINK}
╔══════════════════════════╗
📜 COMMANDES TÉLÉGRAM
╚══════════════════════════╝
▶️ /start   ➜ Démarrer le bot
📋 /menu    ➜ Afficher le menu
❓ /help    ➜ Aide
🔗 /pair    ➜ Lancer un appairage WhatsApp
📲 /link    ➜ Obtenir le lien
📩 /contact ➜ Nous contacter
📊 /users   ➜ Nombre d'utilisateurs
🔓 /unpair  ➜ Déconnecter une session
━━━━━━━━━━━━━━━━━━
Tape /help pour de l'aide
━━━━━━━━━━━━━━━━━━
> power by Mr Kira tech 🌐`),

  help: () =>
    pre(`━━━━━━━━━━━━━━━━━━━━
 ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★
━━━━━━━━━━━━━━━━━━━━
1️⃣ Tapez ➜ /pair
2️⃣ Envoyez le numéro à connecter à WhatsApp
3️⃣ Une fois connecté ✅
4️⃣ Vous verrez les commandes pour utiliser le bot
━━━━━━━━━━━━━━━━━━━`),

  link: () => `📲 <b>Liens officiels</b> — ${esc(CONFIG.BOT_NAME)}`,

  contact: () =>
    `${pre(`📩 Support Kira Tech
Clique sur le bouton ci-dessous pour contacter l'équipe.`)}`,

  users: (count) =>
    pre(`━━━━━━━━━━━━━━━━━━
✦  ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★ ✦
⚜️ By Mr Kira Tech 🌐
━━━━━━━━━━━━━━━━━━━
╔══════════════════════════╗
👥 Nombre d'utilisateurs : ( ${count} ) 🚹🚺
╚══════════════════════════╝
🔗 Bot : ${CONFIG.BOT_LINK}
> Mr Kira tech 🌐`),

  pairUsage: () =>
    `🔗 <b>Appairage WhatsApp</b>\n\nUsage :\n${pre('/pair 242XXXXXXXX')}⚠️ Sans le + devant le numéro.`,

  pairError: () =>
    pre(`⚠️❌ ERREUR : NUMÉRO ERRONÉ ❌⚠️
━━━━━━━━━━━━━━━━━━
🚫 Le numéro que tu as tapé est invalide.
📲 Format correct : 242XXXXXXXX
⛔ Sans le (+) devant.
✅ Exemple : 242XXXXXXXX

🔁 Réessaie : ➜ /pair 242XXXXXXXX
━━━━━━━━━━━━━━━━━━━
> power by Mr Kira tech 🌐`),

  pairing: (number) => `📡 Demande en cours pour ${esc(number)}… 🔄`,

  pairCode: (number, code) =>
    pre(`━━━━━━━━━━━━━━━━━━━
📲 PAIRING CODE pour numéro ${number} ☑️
━━━━━━━━━━━━━━━━━━━
╔══════════════════════════╗
🔑 CODE DE JUMELAGE :
╚══════════════════════════╝

    ┌───────────────┐
    │  ${code}    │
    └───────────────┘

━━━━━━━━━━━━━━━━━━━━━━
👉 INSTRUCTIONS :
━━━━━━━━━━━━━━━━━━━━━━
1️⃣ Envoie ce code au numéro à connecter 📱
2️⃣ Va dans « Appareils liés » 🔗 ➜ « Lier un appareil » ➕
3️⃣ Entre ce code pour associer ce bot 🤖
━━━━━━━━━━━━━━━━━━━━━━
✅ Une fois connecté, tape .menu pour continuer 📜
━━━━━━━━━━━━━━━━━━━
> power by Mr Kira tech 🌐`),

  connected: () =>
    pre(`✨━━━━━━━━━━━━━━━━━━━━✨
🎊🎉 CONGRATULATIONS ! 🎉🎊
✨━━━━━━━━━━━━━━━━━━━━✨
╔══════════════════════════╗
✅ BOT ➜ Connecté 🤖
🟢 STATUS ➜ OPEN
📅 DATE ➜ ${nowStamp()}
⚜️ BY ➜ Mr Kira Tech ⚜️
╚══════════════════════════╝
━━━━━━━━━━━━━━━━━━━━`),

  unpaired: (number) =>
    pre(`🔓 Session WhatsApp déconnectée avec succès.
📴 Numéro : ${number}
> Mr Kira tech 🌐`),
};

/* =====================================================================
   CLAVIERS
   ===================================================================== */
const linkKeyboard = (short = false) => ({
  inline_keyboard: [
    [{ text: '📢 Suivre la chaîne Telegram', url: LINKS.tgChannel }],
    [{ text: short ? '1️⃣ Groupe 1' : '1️⃣ Rejoindre le groupe 1', url: LINKS.tgGroup1 }],
    [{ text: short ? '2️⃣ Groupe 2' : '2️⃣ Rejoindre le groupe 2', url: LINKS.tgGroup2 }],
    [{ text: short ? '📢 Chaîne WhatsApp' : '📢 Suivre la chaîne WhatsApp', url: LINKS.waChannel }],
    [{ text: short ? '🌐 Groupe WhatsApp' : '🌐 Rejoindre le groupe WhatsApp', url: LINKS.waGroup }],
  ],
});

/* =====================================================================
   DÉMARRAGE
   ===================================================================== */
function start(wa) {
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.error('[Telegram] TELEGRAM_TOKEN manquant : ajoute-le dans les variables d’environnement de Render.');
    return null;
  }

  const bot = new TelegramBot(token, { polling: true });
  bot.deleteWebHook().catch(() => {});

  let lastPollingLog = 0;
  bot.on('polling_error', (e) => {
    if (Date.now() - lastPollingLog > 60000) {
      lastPollingLog = Date.now();
      console.error('[Telegram] polling :', e.code || '', e.message);
    }
  });

  const guard = (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (e) {
      console.error('[Telegram] erreur :', e.message);
    }
  };

  async function sendCard(chatId, image, html, extra = {}) {
    const opts = Object.assign({ parse_mode: 'HTML', disable_web_page_preview: true }, extra);
    if (image) {
      try {
        if (html.length <= 950) {
          return await bot.sendPhoto(chatId, image, Object.assign({}, opts, { caption: html }));
        }
        await bot.sendPhoto(chatId, image);
      } catch (e) {
        console.error('[Telegram] image non envoyée :', e.message);
      }
    }
    return bot.sendMessage(chatId, html, opts);
  }

  /* ---------- enregistrement des commandes ---------- */
  const cmd = (name, handler) => {
    const re = new RegExp(`^/${name}(?:@\\w+)?(?:\\s+([\\s\\S]*))?$`, 'i');
    bot.onText(re, guard((msg, match) => handler(msg, ((match && match[1]) || '').trim())));
  };

  bot.on('message', (msg) => {
    if (msg.from && !msg.from.is_bot) storage.addUser(msg.from);
  });

  cmd('start', (msg) =>
    sendCard(msg.chat.id, IMAGES.start, TXT.start(), { reply_markup: linkKeyboard() })
  );

  cmd('menu', (msg) => sendCard(msg.chat.id, IMAGES.start, TXT.menu()));

  cmd('help', (msg) => sendCard(msg.chat.id, IMAGES.help, TXT.help()));

  cmd('link', (msg) => sendCard(msg.chat.id, IMAGES.help, TXT.link(), { reply_markup: linkKeyboard(true) }));

  cmd('contact', (msg) =>
    sendCard(msg.chat.id, IMAGES.contact, TXT.contact(), {
      reply_markup: { inline_keyboard: [[{ text: '💬 Contacter le support', url: CONFIG.SUPPORT_LINK }]] },
    })
  );

  const usersHandler = (msg) =>
    sendCard(msg.chat.id, IMAGES.users, TXT.users(storage.countUsers()), {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📤 Partager le lien du bot',
              url: `https://t.me/share/url?url=${encodeURIComponent(CONFIG.BOT_LINK)}&text=${encodeURIComponent('Découvre ' + CONFIG.BOT_NAME + ' !')}`,
            },
          ],
        ],
      },
    });
  cmd('users', usersHandler);
  cmd('user', usersHandler);

  /* ---------- /pair ---------- */
  cmd('pair', async (msg, arg) => {
    const chatId = msg.chat.id;
    if (!arg) {
      await bot.sendMessage(chatId, TXT.pairUsage(), { parse_mode: 'HTML' });
      return;
    }
    const number = arg.split(/\s+/).join('');
    if (!/^\d{8,15}$/.test(number)) {
      await bot.sendMessage(chatId, TXT.pairError(), { parse_mode: 'HTML' });
      return;
    }

    const mine = storage.sessionsOfChat(chatId);
    if (!mine.includes(number) && mine.length >= MAX_PAIRS) {
      await bot.sendMessage(
        chatId,
        `⛔ Limite atteinte : ${MAX_PAIRS} numéro(s) maximum par utilisateur.\n🔓 Utilise /unpair pour en retirer un.`
      );
      return;
    }

    const wait = await bot.sendMessage(chatId, TXT.pairing(number), { parse_mode: 'HTML' });
    let code;
    try {
      code = await wa.startPairing(number, chatId);
    } catch (e) {
      await bot.deleteMessage(chatId, wait.message_id).catch(() => {});
      if (e.code === 'ALREADY_CONNECTED') {
        await bot.sendMessage(chatId, `✅ Le numéro ${number} est déjà connecté.\n🔓 Pour le déconnecter : /unpair ${number}`);
      } else {
        console.error('[Telegram] pairing :', e.message);
        await bot.sendMessage(
          chatId,
          `⚠️ Impossible de générer le code pour ${number}.\n📲 Vérifie le numéro (indicatif inclus, sans +) puis réessaie : /pair ${number}`
        );
      }
      return;
    }
    await bot.deleteMessage(chatId, wait.message_id).catch(() => {});

    const caption = TXT.pairCode(number, code);
    const rowCheck = { text: '⛔ Check', callback_data: 'check' };
    try {
      await bot.sendPhoto(chatId, IMAGES.pair, {
        caption,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: '📄 Copier', copy_text: { text: code } }, rowCheck]] },
      });
    } catch (e) {
      // anciens clients / API : bouton « Copier » classique (affiche le code en alerte)
      await sendCard(chatId, IMAGES.pair, caption, {
        reply_markup: { inline_keyboard: [[{ text: '📄 Copier', callback_data: `copy:${code}` }, rowCheck]] },
      });
    }
  });

  /* ---------- /unpair ---------- */
  cmd('unpair', async (msg, arg) => {
    const chatId = msg.chat.id;
    const mine = storage.sessionsOfChat(chatId);
    let number = arg.replace(/\s+/g, '');

    if (!number) {
      if (mine.length === 1) number = mine[0];
      else if (mine.length === 0) {
        await bot.sendMessage(chatId, '📴 Aucune session WhatsApp liée à ton compte.\n🔗 Lance /pair 242XXXXXXXX pour en créer une.');
        return;
      } else {
        await bot.sendMessage(chatId, `🔓 Plusieurs sessions actives :\n${mine.map((n) => '• ' + n).join('\n')}\n\nUsage : /unpair 242XXXXXXXX`);
        return;
      }
    }
    if (!mine.includes(number)) {
      await bot.sendMessage(chatId, `⚠️ Aucune session trouvée pour ${number} sur ton compte.`);
      return;
    }
    await wa.unpair(number);
    await bot.sendMessage(chatId, TXT.unpaired(number), { parse_mode: 'HTML' });
  });

  /* ---------- boutons Copier / Check ---------- */
  bot.on(
    'callback_query',
    guard(async (q) => {
      const data = q.data || '';
      if (data === 'check') {
        await bot.answerCallbackQuery(q.id, { text: `📶 Numéros connectés : ${wa.countConnected()}`, show_alert: true });
      } else if (data.startsWith('copy:')) {
        await bot.answerCallbackQuery(q.id, { text: `📄 Code : ${data.slice(5)}`, show_alert: true });
      } else {
        await bot.answerCallbackQuery(q.id);
      }
    })
  );

  /* ---------- événements venant de WhatsApp ---------- */
  wa.init({
    onConnected: (number, chatId) => sendCard(chatId, IMAGES.connect, TXT.connected()),
    onLoggedOut: (number, chatId) =>
      bot.sendMessage(chatId, `📴 La session WhatsApp ${number} a été déconnectée.\n🔗 Relance un appairage avec /pair ${number}`),
    onPairTimeout: (number, chatId) =>
      bot.sendMessage(chatId, `⏱️ Le code pour ${number} a expiré.\n🔁 Relance : /pair ${number}`),
  });

  console.log('[Telegram] bot démarré');
  return bot;
}

module.exports = { start };
