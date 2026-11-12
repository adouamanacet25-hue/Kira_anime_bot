'use strict';
/**
 * Stockage.js — petite base de données JSON (sans dépendance)
 * Garde : utilisateurs Telegram, sessions WhatsApp, scores/badges, actus déjà envoyées, dates des pubs.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaults = () => ({ users: {}, sessions: {}, scores: {}, actuSent: [], ads: {} });

let db = defaults();
let timer = null;

const BADGES = [
  [30, '👑 Hokage Otaku'],
  [15, '🥇 Sensei Otaku'],
  [5, '🥈 Otaku Confirmé'],
  [1, '🥉 Otaku Novice'],
];

function load() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      db = Object.assign(defaults(), raw);
    }
  } catch (e) {
    console.error('[Stockage] lecture impossible :', e.message);
    db = defaults();
  }
}

function flush() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_FILE);
  } catch (e) {
    console.error('[Stockage] écriture impossible :', e.message);
  }
}

function save() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, 1000);
}

/* ---------- Utilisateurs Telegram ---------- */
function addUser(from) {
  if (!from || !from.id) return false;
  const id = String(from.id);
  const isNew = !db.users[id];
  if (isNew) {
    db.users[id] = {
      id,
      username: from.username || '',
      name: [from.first_name, from.last_name].filter(Boolean).join(' '),
      joined: Date.now(),
    };
    save();
  }
  return isNew;
}

function countUsers() {
  return Object.keys(db.users).length;
}

/* ---------- Sessions WhatsApp ---------- */
function getSession(number) {
  return db.sessions[number] || null;
}

function setSession(number, patch) {
  const base = db.sessions[number] || { createdAt: Date.now(), autoOn: false };
  db.sessions[number] = Object.assign({}, base, patch);
  save();
  return db.sessions[number];
}

function deleteSession(number) {
  delete db.sessions[number];
  delete db.ads[number];
  save();
}

function listSessions() {
  return db.sessions;
}

function sessionsOfChat(chatId) {
  return Object.keys(db.sessions).filter((n) => String(db.sessions[n].chatId) === String(chatId));
}

function setAuto(number, on) {
  return setSession(number, { autoOn: !!on });
}

/* ---------- Publicité (toutes les 5 h) ---------- */
function getAd(number) {
  return db.ads[number] || 0;
}

function setAd(number, time) {
  db.ads[number] = time;
  save();
}

/* ---------- Actus déjà envoyées ---------- */
function hasActuSent(link) {
  return db.actuSent.includes(link);
}

function markActuSent(link) {
  db.actuSent.push(link);
  if (db.actuSent.length > 300) db.actuSent = db.actuSent.slice(-300);
  save();
}

/* ---------- Scores & badges otaku ---------- */
function badgeFor(points) {
  const b = BADGES.find(([min]) => points >= min);
  return b ? b[1] : '';
}

function addPoint(number, jid, name) {
  const key = `${number}:${jid}`;
  const entry = db.scores[key] || { points: 0, name: '' };
  const before = badgeFor(entry.points);
  entry.points += 1;
  if (name) entry.name = name;
  db.scores[key] = entry;
  save();
  const badge = badgeFor(entry.points);
  return { points: entry.points, badge, isNewBadge: badge !== before };
}

load();
process.on('exit', flush);

module.exports = {
  load,
  flush,
  addUser,
  countUsers,
  getSession,
  setSession,
  deleteSession,
  listSessions,
  sessionsOfChat,
  setAuto,
  getAd,
  setAd,
  hasActuSent,
  markActuSent,
  addPoint,
  badgeFor,
};
