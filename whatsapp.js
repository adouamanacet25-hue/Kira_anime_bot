'use strict';
/**
 * WhatsApp.js — connexion WhatsApp (Baileys), jumelage par code, commandes « . » et mode auto.
 */
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const baileys = require('@whiskeysockets/baileys');

const makeWASocket = baileys.default || baileys.makeWASocket;
const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = baileys;

const storage = require('./stockage');
const search = require('./recherche');

const { CONFIG, nowStamp } = search;
const { IMAGES, LINKS } = CONFIG;

const AUTH_ROOT = process.env.AUTH_DIR || path.join(__dirname, 'auth');
const MIN = 60000 / (Number(process.env.AUTO_SPEED) || 1); // AUTO_SPEED=60 pour tester vite
const ANSWER_DELAY = 120000; // 2 min pour répondre à une question
const AD_EVERY = 5 * 60 * 60 * 1000; // pub toutes les 5 h
const PREFIX = CONFIG.PREFIX;

const logger = pino({ level: 'silent' });
const log = (...a) => console.log('[WhatsApp]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sessions = new Map(); // numéro -> session
const games = new Map(); // `${numéro}|${jid}` -> question en attente de réponse
let notifier = {};

const LETTERS = ['Ⓐ', 'Ⓑ', 'Ⓒ', 'Ⓓ', 'Ⓔ', 'Ⓕ'];
const SIGN = '> ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★';

/* =====================================================================
   TEXTES (identiques au cahier des charges)
   ===================================================================== */
const TXT = {
  connected: () =>
    `▉ ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★ ▉
✅ BOT ➜ Connecté 🤖
🟢 STATUS ➜ OPEN
📅 DATE ➜ ${nowStamp()}
▰▰▰▰▰▰▰▰▰▰
➠ Auteur : 𝙼𝚛 𝚔𝚒𝚛𝚊 𝚝𝚎𝚌𝚑 🌐
➠ Préfixe : [ ${PREFIX} ]
➠ Tape : ${PREFIX}menu`,

  menu: () =>
    `━━━━━━━━━━━━━━━━━━
✦  ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★ ✦
━━━━━━━━━━━━━━━━━━━
╔═════════════════
┆❏ .menu 🗒
┆❏ .help ❓
┆❏ .ping 🏓
┆❏ .quizz ⁉️
┆❏ .devinette 🔍
┆❏ .image 📖
┆❏ .sondage 📊
┆❏ .actu 📰
┆❏ .jeux 🎁
┆❏ .sticker 🎊
┆❏ .meme 😂
┆❏ .on ✅
┆❏ .off 🚫
╚══════════════════════════╝`,

  help: () =>
    `━━━━━━━━━━━━━━━━━━
✦  ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★ ✦
━━━━━━━━━━━━━━━━━━━
𝙱𝚘𝚝 𝚙𝚘𝚞𝚛 𝚐𝚎𝚛𝚎𝚛 𝚏𝚊𝚌𝚒𝚕𝚎𝚖𝚎𝚗𝚝 𝚕𝚎𝚜 𝚌𝚑𝚊î𝚗𝚎𝚜 𝚎𝚝 𝚐𝚛𝚘𝚞𝚙𝚎𝚜 𝚠𝚑𝚊𝚝𝚜𝚊𝚙𝚙 𝚘𝚝𝚊𝚔𝚞

* 𝚀𝚞𝚒𝚣𝚣 💖
* 𝙳𝚎𝚟𝚒𝚗𝚎𝚝𝚝𝚎 🔎
* 𝙰𝚌𝚝𝚞 📰
* 𝙹𝚎𝚞𝚡 🛎
* 𝙸𝚖𝚊𝚐𝚎 📕
* 𝚂𝚝𝚒𝚌𝚔𝚎𝚛𝚜 🎊
* 𝚂𝚘𝚗𝚍𝚊𝚐𝚎 📊
* 𝙼𝚎𝚖𝚎 😂
━━━━━━━━━━━━━━━━━━
> power by Kira tech 🧬`,

  ping: (ms) =>
    `🏓 PONG !
━━━━━━━━━━━━━━━━━━
📡 Latence : ${ms} ms
🟢 Statut : OPEN
━━━━━━━━━━━━━━━━━━
> Mr Kira Tech 🌐`,

  on: (groups) =>
    `🎉 MODE AUTO ACTIVÉ ✅
━━━━━━━━━━━━━━━━━━
🔄 Cycle : Quizz ➜ Devinette ➜ Actu ➜ Jeux ➜ Sondage ➜ Meme
⏱️ Intervalle : 10 minutes
📊 Statistiques : ${groups} groupe(s) détecté(s)
━━━━━━━━━━━━━━━━━━
> Mr Kira Tech 🌐`,

  off: () =>
    `🚫 MODE AUTO DÉSACTIVÉ
━━━━━━━━━━━━━━━━━━
⏸️ Toutes les publications automatiques sont stoppées.
🔕 Cycles annulés : Quizz · Devinette · Actu · Jeux · Sondage · Meme
🟢 Commandes manuelles toujours actives
💡 Tape .on pour réactiver le mode auto
━━━━━━━━━━━━━━━━━━
> Mr Kira Tech 🌐`,

  jeux: () =>
    `🎁 𝗠𝗜𝗡𝗜-𝗝𝗘𝗨𝗫 𝗢𝗧𝗔𝗞𝗨
━━━━━━━━━━━━━━━━━━
🎮 Quiz rapide · Devinette image · Qui suis-je ?
🏆 Gagne des badges otaku virtuels !
━━━━━━━━━━━━━━━━━━
> Mr Kira Tech 🌐`,

  actu: (a) =>
    `📰 𝗔𝗖𝗧𝗨 𝗢𝗧𝗔𝗞𝗨 — ${a.date}
━━━━━━━━━━━━━━━━━━
🎬 ${a.title}
📝 ${a.summary || 'Résumé indisponible.'}
🔗 Lire plus : ${a.link}
━━━━━━━━━━━━━━━━━━
> Mr Kira Tech 🌐`,

  meme: () =>
    `😂 𝗠𝗘𝗠𝗘 𝗢𝗧𝗔𝗞𝗨
━━━━━━━━━━━━━━━━━━
MDR 🤣 !!! Qui a la réf 

${SIGN}`,

  image: () => `Que pensez-vous de lui 🤭✨\n> ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 ★`,

  stickers: (name) => `𝚙𝚊𝚌𝚔𝚜 𝚍𝚎 𝚜𝚝𝚒𝚌𝚔𝚎𝚛𝚜 🛍🎉 𝚍𝚎 ${name}\n\n🎊 Sticker otaku d’un personnage\n${SIGN}`,

  ad: () =>
    `━━━━━━━━━━━━━━━━━━
✦  ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★ ✦
━━━━━━━━━━━━━━━━━━━
📢 Rejoins nos canaux & groupes otaku !

📢 Chaîne Telegram : ${LINKS.tgChannel}
1️⃣ Groupe 1 : ${LINKS.tgGroup1}
2️⃣ Groupe 2 : ${LINKS.tgGroup2}
📢 Chaîne WhatsApp : ${LINKS.waChannel}
🌐 Groupe WhatsApp : ${LINKS.waGroup}

🤖 Ajoute le bot : ${CONFIG.BOT_LINK}
━━━━━━━━━━━━━━━━━━
> power by Mr Kira tech 🌐`,
};

/* =====================================================================
   OUTILS
   ===================================================================== */
function safe(fn) {
  try {
    const r = fn();
    if (r && typeof r.catch === 'function') r.catch((e) => log('erreur :', e.message));
  } catch (e) {
    log('erreur :', e.message);
  }
}

const authDir = (number) => path.join(AUTH_ROOT, number);

function newSession(number, chatId, announce) {
  return {
    number,
    chatId,
    sock: null,
    open: false,
    announce: !!announce,
    attempts: 0,
    closing: false,
    groups: { at: 0, list: [] },
    schedToken: null,
    schedRunning: false,
    adTimer: null,
    pairTimer: null,
  };
}

function formatQuestion(q, style) {
  const choices = q.choices.map((c, i) => `${LETTERS[i]} ${c} ${q.emojis[i] || ''}`.trim()).join('\n');
  const foot = '\n\n💬 Réponds : A · B · C · D (2 min)';
  if (style === 'devinette') return `${q.q}\n> ★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 ★\n\n${choices}${foot}`;
  return `${SIGN}\n${q.q} ✨😊\n\n${choices}${foot}`;
}

const answerLabel = (q) => `${LETTERS[q.answer]} ${q.choices[q.answer]} ${q.emojis[q.answer] || ''}`.trim();

async function sendMedia(sock, jid, url, text, opts = {}) {
  if (url) {
    try {
      return await sock.sendMessage(jid, { image: { url }, caption: text }, opts);
    } catch (e) {
      log('image non envoyée :', e.message);
    }
  }
  return sock.sendMessage(jid, { text }, opts);
}

function getTs(m) {
  const t = m.messageTimestamp;
  if (!t) return 0;
  if (typeof t === 'object') return t.toNumber ? t.toNumber() : Number(t.low);
  return Number(t);
}

function unwrap(message) {
  let msg = message;
  for (let i = 0; i < 5 && msg; i++) {
    const inner = msg.ephemeralMessage || msg.viewOnceMessage || msg.viewOnceMessageV2 || msg.documentWithCaptionMessage;
    if (inner && inner.message) msg = inner.message;
    else break;
  }
  return msg || {};
}

function extractText(msg) {
  return (
    msg.conversation ||
    (msg.extendedTextMessage && msg.extendedTextMessage.text) ||
    (msg.imageMessage && msg.imageMessage.caption) ||
    (msg.videoMessage && msg.videoMessage.caption) ||
    ''
  );
}

/* =====================================================================
   QUESTIONS EN ATTENTE DE RÉPONSE (quizz / devinette / jeux) + BADGES
   ===================================================================== */
function registerGame(number, jid, q, sent) {
  const key = `${number}|${jid}`;
  const prev = games.get(key);
  if (prev) clearTimeout(prev.timer);
  const g = { number, jid, q, sent, timer: null };
  g.timer = setTimeout(() => revealGame(key, g), ANSWER_DELAY);
  games.set(key, g);
}

async function revealGame(key, g) {
  if (games.get(key) !== g) return;
  games.delete(key);
  const s = sessions.get(g.number);
  if (!s || !s.open) return;
  try {
    await s.sock.sendMessage(
      g.jid,
      { text: `⏰ Temps écoulé !\n✅ Réponse : ${answerLabel(g.q)}\n${SIGN}` },
      g.sent ? { quoted: g.sent } : {}
    );
  } catch (e) {
    /* ignoré */
  }
}

async function checkAnswer(c) {
  const key = `${c.number}|${c.jid}`;
  const g = games.get(key);
  if (!g || !c.text) return;
  const t = c.text.trim();
  if (!t || t.length > 60) return;

  const n = search.normalize(t);
  const letter = 'abcdef'[g.q.answer];
  const ans = search.normalize(g.q.choices[g.q.answer]);
  const ok = n === letter || (ans.length >= 4 && n === ans);
  if (!ok) return;

  clearTimeout(g.timer);
  games.delete(key);

  const r = storage.addPoint(c.number, c.sender, c.name);
  const tag = `@${c.sender.split('@')[0]}`;
  let text = `🏆 Bravo ${tag} ! Bonne réponse ✅\n✅ Réponse : ${answerLabel(g.q)}\n🎖️ ${r.badge} — ${r.points} pt(s)`;
  if (r.isNewBadge) text += '\n🎉 Nouveau badge otaku débloqué !';
  text += `\n${SIGN}`;
  await c.sock.sendMessage(c.jid, { text, mentions: [c.sender] }, { quoted: c.m });
}

/* =====================================================================
   CONTENUS (utilisés par les commandes ET par le mode auto)
   ===================================================================== */
async function buildContent(kind, idx = 0) {
  switch (kind) {
    case 'quizz': {
      const q = search.getQuiz();
      return { type: 'question', q, text: formatQuestion(q, 'quizz'), image: IMAGES.quizz || null };
    }
    case 'devinette': {
      const q = await search.getDevinette(idx);
      return { type: 'question', q, text: formatQuestion(q, 'devinette'), image: q.image || null };
    }
    case 'jeux': {
      const g = await search.getJeu();
      return {
        type: 'question',
        q: g.q,
        text: `🎁 ${g.title}\n━━━━━━━━━━━━━━━━━━\n${formatQuestion(g.q, 'devinette')}`,
        image: g.q.image || IMAGES.jeux || null,
      };
    }
    case 'actu': {
      const a = await search.getActu();
      return { type: 'media', text: TXT.actu(a), image: a.image };
    }
    case 'image': {
      const url = await search.getImage();
      return { type: 'media', text: TXT.image(), image: url };
    }
    case 'sondage': {
      const p = search.getSondage();
      return { type: 'poll', poll: p };
    }
    case 'meme': {
      const m = await search.getMeme();
      return { type: 'media', text: TXT.meme(), image: m.url };
    }
    case 'sticker': {
      const pack = await search.getStickerPack();
      return { type: 'stickers', pack };
    }
    case 'pub': {
      return { type: 'media', text: TXT.ad(), image: IMAGES.start };
    }
    default:
      throw new Error('contenu inconnu : ' + kind);
  }
}

async function deliver(sock, jid, number, content, opts = {}) {
  switch (content.type) {
    case 'question': {
      const sent = await sendMedia(sock, jid, content.image, content.text, opts);
      registerGame(number, jid, content.q, sent);
      return sent;
    }
    case 'media':
      return sendMedia(sock, jid, content.image, content.text, opts);
    case 'poll':
      return sock.sendMessage(jid, { poll: { name: content.poll.name, values: content.poll.values, selectableCount: 1 } }, opts);
    case 'stickers': {
      const p = content.pack;
      const sent = await sendMedia(sock, jid, p.image, TXT.stickers(p.name), opts);
      if (p.stickers.length) {
        for (const buf of p.stickers) {
          await sock.sendMessage(jid, { sticker: buf });
          await sleep(700);
        }
      } else {
        for (const url of p.images.slice(1)) {
          try {
            await sock.sendMessage(jid, { image: { url } });
            await sleep(700);
          } catch (e) {
            /* ignoré */
          }
        }
      }
      return sent;
    }
    default:
      return null;
  }
}

/* =====================================================================
   COMMANDES WHATSAPP
   ===================================================================== */
async function react(c, emoji) {
  try {
    await c.sock.sendMessage(c.jid, { react: { text: emoji, key: c.m.key } });
  } catch (e) {
    /* ignoré */
  }
}

async function runContent(c, emoji, kind, idx) {
  await react(c, emoji);
  const content = await buildContent(kind, idx);
  await deliver(c.sock, c.jid, c.number, content, { quoted: c.m });
}

const COMMANDS = {
  async menu(c) {
    await react(c, '🗒');
    await sendMedia(c.sock, c.jid, IMAGES.menu, TXT.menu(), { quoted: c.m });
  },
  async help(c) {
    await react(c, '❓');
    await sendMedia(c.sock, c.jid, IMAGES.waHelp, TXT.help(), { quoted: c.m });
  },
  async ping(c) {
    const t0 = Date.now();
    await react(c, '🏓');
    const ms = Math.max(1, Date.now() - t0);
    await sendMedia(c.sock, c.jid, IMAGES.ping, TXT.ping(ms), { quoted: c.m });
  },
  async quizz(c) {
    await runContent(c, '⁉️', 'quizz');
  },
  async devinette(c) {
    await runContent(c, '🔍', 'devinette', Math.floor(Math.random() * 3));
  },
  async actu(c) {
    await runContent(c, '📰', 'actu');
  },
  async image(c) {
    await runContent(c, '📖', 'image');
  },
  async sondage(c) {
    await runContent(c, '📊', 'sondage');
  },
  async jeux(c) {
    await react(c, '🎁');
    await sendMedia(c.sock, c.jid, IMAGES.jeux, TXT.jeux(), { quoted: c.m });
    const content = await buildContent('jeux');
    await deliver(c.sock, c.jid, c.number, content, {});
  },
  async sticker(c) {
    await runContent(c, '🎊', 'sticker');
  },
  async meme(c) {
    await runContent(c, '😂', 'meme');
  },
  async on(c) {
    if (!c.isOwner) {
      await c.sock.sendMessage(c.jid, { text: '⛔ Commande réservée au propriétaire du bot.' }, { quoted: c.m });
      return;
    }
    await react(c, '✅');
    storage.setAuto(c.number, true);
    const groups = await getGroups(c.s, true);
    await sendMedia(c.sock, c.jid, IMAGES.on, TXT.on(groups.length), { quoted: c.m });
    startScheduler(c.number);
  },
  async off(c) {
    if (!c.isOwner) {
      await c.sock.sendMessage(c.jid, { text: '⛔ Commande réservée au propriétaire du bot.' }, { quoted: c.m });
      return;
    }
    await react(c, '🚫');
    storage.setAuto(c.number, false);
    stopScheduler(c.number);
    await sendMedia(c.sock, c.jid, IMAGES.off, TXT.off(), { quoted: c.m });
  },
};
COMMANDS.quiz = COMMANDS.quizz;
COMMANDS.stickers = COMMANDS.sticker;

async function handleMessage(number, sock, m, type) {
  if (!m.message || !m.key || !m.key.remoteJid) return;
  const jid = m.key.remoteJid;
  if (jid === 'status@broadcast' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) return;

  const age = Date.now() / 1000 - getTs(m);
  if (age > 120) return; // ignore l'historique
  if (type !== 'notify' && !m.key.fromMe) return;

  const s = sessions.get(number);
  if (!s || s.sock !== sock) return;

  const msg = unwrap(m.message);
  if (msg.protocolMessage || msg.reactionMessage) return;
  const text = extractText(msg).trim();
  if (!text) return;

  const isGroup = jid.endsWith('@g.us');
  const sender = jidNormalizedUser(m.key.participant || (m.key.fromMe ? sock.user.id : jid));
  const c = {
    number,
    s,
    sock,
    jid,
    m,
    text,
    sender,
    name: m.pushName || sender.split('@')[0],
    isGroup,
    isOwner: !!m.key.fromMe || sender.split('@')[0] === number,
  };

  if (text.startsWith(PREFIX) && /^[a-zA-Z]/.test(text.slice(PREFIX.length))) {
    const cmd = text.slice(PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
    const fn = COMMANDS[cmd];
    if (!fn) return;
    try {
      await fn(c);
    } catch (e) {
      log(`commande .${cmd} en erreur :`, e.message);
      try {
        await sock.sendMessage(jid, { text: '⚠️ Petit souci, réessaie dans un instant 🙏\n> Mr Kira Tech 🌐' }, { quoted: m });
      } catch (e2) {
        /* ignoré */
      }
    }
    return;
  }

  await checkAnswer(c);
}

async function onUpsert(number, sock, update) {
  for (const m of update.messages || []) {
    try {
      await handleMessage(number, sock, m, update.type);
    } catch (e) {
      log('message ignoré :', e.message);
    }
  }
}

/* =====================================================================
   MODE AUTO : cycle de publications dans les groupes
   ===================================================================== */
const CYCLE = [
  { kind: 'quizz', count: 5, every: 3, pause: 30 },
  { kind: 'devinette', count: 3, every: 5, pause: 45 },
  { kind: 'actu', count: 2, every: 10, pause: 45 },
  { kind: 'sondage', count: 3, every: 5, pause: 45 },
  { kind: 'sticker', count: 1, every: 0, pause: 30 },
  { kind: 'meme', count: 2, every: 10, pause: 15 },
];

async function getGroups(s, force = false) {
  if (!s || !s.open) return [];
  if (!force && Date.now() - s.groups.at < 5 * 60000) return s.groups.list;
  try {
    const all = await s.sock.groupFetchAllParticipating();
    s.groups = { at: Date.now(), list: Object.keys(all || {}) };
  } catch (e) {
    log('liste des groupes indisponible :', e.message);
  }
  return s.groups.list;
}

async function broadcast(number, kind, idx, isAlive) {
  const s = sessions.get(number);
  if (!s || !s.open) return;
  const groups = await getGroups(s);
  if (!groups.length) return;

  let content;
  try {
    content = await buildContent(kind, idx);
  } catch (e) {
    log(`auto ${kind} ignoré :`, e.message);
    return;
  }

  for (const jid of groups) {
    if (!isAlive() || !s.open) return;
    try {
      await deliver(s.sock, jid, number, content);
    } catch (e) {
      log(`envoi ${kind} échoué (${jid}) :`, e.message);
    }
    await sleep(2000 + Math.random() * 2500);
  }
}

function startScheduler(number) {
  const s = sessions.get(number);
  if (!s || s.schedRunning) return;

  const token = Symbol('cycle');
  s.schedToken = token;
  s.schedRunning = true;

  const isAlive = () => {
    const cur = sessions.get(number);
    const st = storage.getSession(number);
    return cur === s && s.schedToken === token && !s.closing && !!(st && st.autoOn);
  };

  const wait = async (ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end && isAlive()) await sleep(Math.min(15000, end - Date.now()));
  };

  if (!storage.getAd(number)) storage.setAd(number, Date.now());
  if (s.adTimer) clearInterval(s.adTimer);
  s.adTimer = setInterval(() => {
    if (!isAlive() || !s.open) return;
    if (Date.now() - storage.getAd(number) >= AD_EVERY) {
      storage.setAd(number, Date.now());
      broadcast(number, 'pub', 0, isAlive).catch((e) => log('pub :', e.message));
    }
  }, 5 * 60000);

  (async () => {
    try {
      while (isAlive()) {
        for (const step of CYCLE) {
          for (let i = 0; i < step.count; i++) {
            if (!isAlive()) return;
            await broadcast(number, step.kind, i, isAlive);
            if (i < step.count - 1) await wait(step.every * MIN);
          }
          await wait(step.pause * MIN);
          if (!isAlive()) return;
        }
      }
    } catch (e) {
      log('cycle auto interrompu :', e.message);
    } finally {
      s.schedRunning = false;
      if (s.schedToken === token) s.schedToken = null;
    }
  })();
}

function stopScheduler(number) {
  const s = sessions.get(number);
  if (!s) return;
  s.schedToken = null;
  if (s.adTimer) {
    clearInterval(s.adTimer);
    s.adTimer = null;
  }
}

/* =====================================================================
   CONNEXION / JUMELAGE
   ===================================================================== */
async function connect(number, wantCode) {
  const s = sessions.get(number);
  if (!s) return null;

  const dir = authDir(number);
  fs.mkdirSync(dir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(dir);

  const conf = {
    logger,
    printQRInTerminal: false,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  };
  try {
    const v = await fetchLatestBaileysVersion();
    if (v && v.version) conf.version = v.version;
  } catch (e) {
    /* version par défaut de Baileys */
  }

  const sock = makeWASocket(conf);
  s.sock = sock;
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (u) => onConnection(number, sock, u));
  sock.ev.on('messages.upsert', (u) => onUpsert(number, sock, u));

  if (wantCode && !state.creds.registered) {
    await sleep(3000);
    const raw = await sock.requestPairingCode(number);
    return String(raw).replace(/[^A-Za-z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-');
  }
  return null;
}

async function onOpen(number, s, sock) {
  if (s.announce) {
    s.announce = false;
    storage.setSession(number, { chatId: s.chatId });
    safe(() => notifier.onConnected && notifier.onConnected(number, s.chatId));
    try {
      const me = jidNormalizedUser(sock.user.id);
      await sendMedia(sock, me, IMAGES.waConnect, TXT.connected());
    } catch (e) {
      log('message de connexion non envoyé :', e.message);
    }
  }
  const st = storage.getSession(number);
  if (st && st.autoOn) startScheduler(number);
}

async function onConnection(number, sock, update) {
  const s = sessions.get(number);
  if (!s || s.sock !== sock || s.closing) return;
  const { connection, lastDisconnect } = update;

  if (connection === 'open') {
    s.open = true;
    s.attempts = 0;
    if (s.pairTimer) {
      clearTimeout(s.pairTimer);
      s.pairTimer = null;
    }
    log(number, 'connecté');
    await onOpen(number, s, sock);
    return;
  }

  if (connection === 'close') {
    s.open = false;
    const err = lastDisconnect && lastDisconnect.error;
    const status = err && err.output && err.output.statusCode;
    log(number, 'déconnecté, code', status);

    if (status === DisconnectReason.loggedOut) {
      const chatId = s.chatId;
      await destroy(number, true);
      safe(() => notifier.onLoggedOut && notifier.onLoggedOut(number, chatId));
      return;
    }
    if (status === DisconnectReason.connectionReplaced) {
      await destroy(number, false);
      return;
    }

    s.attempts += 1;
    const registered = sock.authState && sock.authState.creds && sock.authState.creds.registered;
    if (!registered && s.attempts > 6) {
      await destroy(number, true);
      return;
    }
    await sleep(Math.min(3000 * s.attempts, 30000));
    if (sessions.get(number) !== s || s.closing) return;
    try {
      await connect(number, false);
    } catch (e) {
      log('reconnexion impossible :', e.message);
    }
  }
}

async function destroy(number, removeAuth) {
  const s = sessions.get(number);
  if (s) {
    s.closing = true;
    s.schedToken = null;
    if (s.pairTimer) clearTimeout(s.pairTimer);
    if (s.adTimer) clearInterval(s.adTimer);
    try {
      if (s.sock) s.sock.ev.removeAllListeners('connection.update');
    } catch (e) {
      /* ignoré */
    }
    try {
      if (s.sock) s.sock.end(undefined);
    } catch (e) {
      /* ignoré */
    }
    sessions.delete(number);
  }
  if (removeAuth) {
    try {
      fs.rmSync(authDir(number), { recursive: true, force: true });
    } catch (e) {
      /* ignoré */
    }
    storage.deleteSession(number);
  }
}

async function startPairing(number, chatId) {
  const old = sessions.get(number);
  if (old && old.open) {
    const e = new Error('ALREADY_CONNECTED');
    e.code = 'ALREADY_CONNECTED';
    throw e;
  }
  if (old) await destroy(number, true);

  const s = newSession(number, chatId, true);
  sessions.set(number, s);

  s.pairTimer = setTimeout(async () => {
    if (sessions.get(number) === s && !s.open) {
      await destroy(number, true);
      safe(() => notifier.onPairTimeout && notifier.onPairTimeout(number, chatId));
    }
  }, 5 * 60 * 1000);

  try {
    const code = await connect(number, true);
    if (!code) throw new Error('NO_CODE');
    return code;
  } catch (e) {
    await destroy(number, true);
    throw e;
  }
}

async function unpair(number) {
  const s = sessions.get(number);
  if (s && s.sock && s.open) {
    s.closing = true;
    try {
      await s.sock.logout();
    } catch (e) {
      log('logout :', e.message);
    }
  }
  await destroy(number, true);
  return true;
}

async function restoreAll() {
  const all = storage.listSessions();
  for (const number of Object.keys(all)) {
    const credsFile = path.join(authDir(number), 'creds.json');
    let registered = false;
    try {
      registered = !!JSON.parse(fs.readFileSync(credsFile, 'utf8')).registered;
    } catch (e) {
      registered = false;
    }
    if (!registered) {
      storage.deleteSession(number);
      continue;
    }
    sessions.set(number, newSession(number, all[number].chatId, false));
    try {
      await connect(number, false);
    } catch (e) {
      log('restauration impossible', number, e.message);
    }
    await sleep(3000);
  }
  log('sessions restaurées :', sessions.size);
}

function init(n) {
  notifier = n || {};
}

function countConnected() {
  let n = 0;
  for (const s of sessions.values()) if (s.open) n++;
  return n;
}

function isConnected(number) {
  const s = sessions.get(number);
  return !!(s && s.open);
}

module.exports = { init, startPairing, unpair, restoreAll, countConnected, isConnected };
