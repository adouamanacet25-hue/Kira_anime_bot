const axios = require('axios');
const os = require('os');
const crypto = require('crypto');
const dns = require('dns').promises;
const B = require('@whiskeysockets/baileys');
let sharp; try { sharp = require('sharp'); } catch (e) {}
const evenement = require('./evenement.js');

const SIG = '> 𝙿𝚘𝚠𝚎𝚛 𝚋𝚢 𝚔𝚒𝚛𝚊 𝚝𝚎𝚌𝚑 🌐';
const VERSION = '1.0.0', BUILD = '2024.11.001', LAST_UPDATE = '15/11/2024', OWNER_NAME = 'Kira Tech';
const IMG = {
  menu: 'https://i.ibb.co/xqZMd5cg/213-CD2-B1-5-BAE-4-A52-8537-CA19-B7-F93557.jpg',
  rules: 'https://i.ibb.co/MDkL4BXX/CEA8-BF8-D-ADD2-45-A5-9683-7-AF788316-FBE.jpg',
  about: 'https://i.ibb.co/HLpw1qGK/BCDC18-D4-1-EC3-4386-87-A3-BEC3-B3-D70-D4-F.jpg',
  version: 'https://i.ibb.co/dqjQWfQ/AE60-CAF6-4623-4-AD9-8-F34-3-D6-A48-D6-D60-A.jpg',
  status: 'https://i.ibb.co/8gczPkFS/384-B7-B6-E-525-D-4333-AC46-72936210-C9-FE.jpg',
  tagall: 'https://i.ibb.co/qMnhZZV7/3165500-D-6-CF3-4285-B9-BC-8-F260-D294-CE1.jpg',
  kickall: 'https://i.ibb.co/BWkPMf6/1258-A93-E-C190-44-C6-8447-4362-E38185-EF.jpg',
  antilink: 'https://i.ibb.co/NgjjVFC5/943-D7597-2-B5-C-4268-A090-81881-ACA65-DB.jpg',
  tagadmin: 'https://i.ibb.co/jkfYR0Vd/21875-A1-F-26-D3-466-E-871-D-872-AD140-BCD6.jpg',
  promoteall: 'https://i.ibb.co/jkfYR0Vd/21875-A1-F-26-D3-466-E-871-D-872-AD140-BCD6.jpg',
  antispam: 'https://i.ibb.co/mrHGtJ9k/2-C23-A4-FA-92-F9-4-E49-934-C-D1-F4-CF805-E4-F.jpg',
  antibot: 'https://i.ibb.co/mrHGtJ9k/2-C23-A4-FA-92-F9-4-E49-934-C-D1-F4-CF805-E4-F.jpg',
  antidelete: 'https://i.ibb.co/5XmqZZ5w/50-DC6-F86-DAB1-4-DDC-99-EC-D0-D59-CBB539-D.jpg',
  listmembers: 'https://i.ibb.co/xKvZvsWD/1-C937704-41-AA-4-D17-BF35-0-C2-AC356-B23-C.jpg',
  warnings: 'https://i.ibb.co/05PSny2/64-C52-C95-490-A-424-A-9-C3-D-5635162-AF895.jpg',
  purge: 'https://i.ibb.co/DgYwTzkM/262-A9772-C1-BD-484-E-83-F5-CC1-C51-D1-F470.jpg',
  flirt: 'https://i.ibb.co/ymR8mwBL/FFF33-B2-A-16-CC-4-FD6-A5-AA-EC8-DC58-EDF9-E.jpg',
  compliment: 'https://i.ibb.co/VfVTfLH/7-F666547-589-A-4368-9366-61-C6-E2-FF976-A.jpg'
};

// ---------- Catégories (menu + réactions) ----------
const CATS = [
  ['GÉNÉRAL', [['menu','📋'],['ping','🏓'],['help','❓'],['info','ℹ️'],['speed','⚡'],['uptime','⏱️'],['owner','👑'],['stats','📊'],['report','🐞'],['feedback','💬'],['support','🛠️'],['rules','📜'],['about','🤖'],['version','🔢'],['changelog','🆕'],['donate','💝'],['premium','💎'],['status','✅'],['runtime','⏳'],['shard','🧩'],['credits','🙌'],['botinfo','🤖'],['id','🆔'],['myid','👤'],['profile','🪪']]],
  ['GROUP', [['tagall','📢'],['kick','👢'],['kickall','🧹'],['promote','⬆️'],['demote','⬇️'],['mute','🔇'],['unmute','🔊'],['antilink','🚫'],['welcome','👋'],['goodbye','🚪'],['groupinfo','🗂️'],['admin','🛡️'],['tagadmin','📣'],['setdesc','📝'],['setname','✏️'],['promoteall','⏫'],['demoteall','⏬'],['add','➕'],['leave','🏃'],['revoke','🔄'],['resetlink','🔁'],['linkgc','🔗'],['setppgc','🖼️'],['setpgroup','⚙️'],['antispam','🚫'],['antibot','🛑'],['antidelete','🚮'],['antitag','🔕'],['nsfw','🔞'],['captcha','🔐'],['approve','✅'],['reject','❌'],['listadmin','👮'],['listmembers','👥'],['count','🔢']]],
  ['ADMIN / MODÉRATION', [['ban','⛔'],['unban','🔓'],['warn','⚠️'],['unwarn','🧽'],['warnings','📌'],['resetwarn','♻️'],['block','🚫'],['unblock','✅'],['blacklist','⚫'],['whitelist','⚪'],['purge','🧹'],['setwarn','⚙️'],['setprefix','🔣'],['lock','🔒'],['unlock','🔑'],['slowmode','🐢'],['antiflood','🛑'],['antinsfw','🚷'],['setlang','🌐'],['settimezone','🕒']]],
  ['FUN', [['joke','😂'],['meme','🖼️'],['quote','💬'],['fact','💡'],['riddle','❓'],['truth','💯'],['dare','🎯'],['8ball','🎱'],['ship','💘'],['rate','⭐'],['gay','🏳️‍🌈'],['simp','😍'],['pp','📏'],['iq','🧠'],['dice','🎲'],['coin','🪙'],['slot','🎰'],['wyr','🤔'],['nhie','🙋'],['random','🔀'],['lovecalc','❤️'],['flirt','😘'],['roast','🔥'],['compliment','🌹'],['reverse','🔄']]],
  ['MÉDIA / STICKER', [['image','🖼️'],['giff','🎞️'],['sticker','🏷️'],['vv','👁️'],['toimg','📷'],['tovideo','🎬'],['toaudio','🎵'],['tourl','🔗'],['attp','✨'],['ttp','🔤'],['emojimix','🧩'],['take','📝'],['qc','🖋️'],['memeimg','😂'],['carbon','💻'],['ss','📸'],['screenshot','🖥️'],['resize','📐'],['blur','🌫️'],['grayscale','🩶'],['invert','🔃'],['rotate','🔁'],['crop','✂️'],['circle','⭕'],['removebg','🪄']]],
  ['TÉLÉCHARGEMENT', [['ytmp3','🎧'],['ytmp4','📹'],['ytdl','⬇️'],['play','▶️'],['video','📺'],['song','🎶'],['instagram','📷'],['tiktok','🕺'],['facebook','📘'],['twitter','🐦'],['spotify','🟢'],['soundcloud','☁️'],['pinterest','📌'],['imgur','🖼️'],['gdrive','📁'],['mediafire','📥'],['apk','📱'],['playstore','🛍️'],['imdb','🎥'],['wiki','📚']]],
  ['RECHERCHE', [['google','🔍'],['bing','🔎'],['youtube','📺'],['weather','🌤️'],['news','📰'],['movie','🎬'],['anime','🍥'],['manga','📖'],['lyrics','🎤'],['define','📘'],['translate','🌐'],['tts','🗣️'],['stt','👂'],['wiki2','📚'],['ghsearch','🐙']]],
  ['AI', [['ai','🤖'],['gpt','🧠'],['gemini','♊'],['dalle','🎨'],['midjourney','🖌️'],['imagine','💭'],['code','💻'],['explain','🧾'],['summarize','📝'],['paraphrase','🔁'],['correct','✅'],['essay','📄'],['poem','🪶'],['story','📖'],['bible','✝️']]],
  ['TOOLS', [['afk','😴'],['back','🔙'],['remind','⏰'],['timer','⏲️'],['calc','🧮'],['qr','🔳'],['short','🔗'],['password','🔐'],['base64','🔤'],['encrypt','🔒'],['decrypt','🔓'],['hash','#️⃣'],['uuid','🆔'],['color','🎨'],['ip','🌐'],['whois','🕵️'],['dns','🌍'],['ping2','📡'],['currency','💱'],['unit','📏']]]
];
const EMO = {}; CATS.forEach(([, l]) => l.forEach(([n, e]) => { EMO[n] = e; }));
const TOTAL = Object.keys(EMO).length;
const TITLE = { info: 'INFOS BOT', speed: 'SPEED TEST', rules: 'RÈGLES', about: 'À PROPOS', report: 'SIGNALER UN BUG', stats: 'STATISTIQUES', id: 'ID DU CHAT', myid: 'TON ID', profile: 'PROFIL', admin: 'ADMIN LIST', botinfo: 'BOT INFO' };

// ---------- utilitaires ----------
const num = (j) => String(j || '').split('@')[0].split(':')[0];
const pad = (n) => String(n).padStart(2, '0');
const stampDate = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())} / ${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`; };
const fmtUp = (s) => { s = Math.floor(s); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return `${d}j ${h}h ${m}m ${s % 60}s`; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const J = async (url, opt = {}) => (await axios.get(url, Object.assign({ timeout: 20000 }, opt))).data;
const BUF = async (url) => Buffer.from((await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 })).data);
const OK = 'Success', KO = 'Failed';
const esc = (t) => String(t).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));

const fmt = (name, rows) => `*${EMO[name]} ${TITLE[name] || name.toUpperCase()}*\n` +
  rows.map((r) => Array.isArray(r) ? `▸ ${r[0]} : ${r[1]}` : `▸ ${r}`).join('\n') + `\n\n${SIG}`;

function menuText(ctx) {
  const cfg = ctx.config; const p = ctx.db.prefix || '.';
  let t = `▉ ${cfg.botName} 🌹▉\n\n✅ BOT ➜ Connecté 🤖\n🟢 STATUS ➜ OPEN\n📅 DATE ➜ ${stampDate()}\n▰▰▰▰▰▰▰▰▰▰\n➠ Auteur : ${cfg.supportUser}\n➠ Préfixe : [ ${p} ]\n➠ Total Cmds : [ ${TOTAL} ]\n`;
  for (const [title, list] of CATS) {
    t += `\n╢ ${title} ♰\n╭▰▰▰▰▰▰▰◈\n` + list.map(([n, e]) => `┆❏ ${p}${n} ${e}`).join('\n') + `\n╰▰▰▰▰▰▰▰◈\n`;
  }
  return t + `\nEND…… 🌐\n\n> 𝙿𝚘𝚠𝚎𝚛 𝚋𝚢 𝚔𝚒𝚛𝚊 𝚝𝚎𝚌𝚑 🌐`;
}

const getText = (m) => !m ? '' : (m.conversation || (m.extendedTextMessage && m.extendedTextMessage.text) || (m.imageMessage && m.imageMessage.caption) || (m.videoMessage && m.videoMessage.caption) || '');
const unwrap = (m) => (m && (m.ephemeralMessage && m.ephemeralMessage.message || m.viewOnceMessage && m.viewOnceMessage.message || m.viewOnceMessageV2 && m.viewOnceMessageV2.message || m.documentWithCaptionMessage && m.documentWithCaptionMessage.message)) || m;

// ---------- jeux de données FUN ----------
const D = {
  joke: ['Pourquoi les plongeurs plongent-ils en arrière ? Parce que sinon ils tombent dans le bateau 😂', 'Que fait une fraise sur un cheval ? Tagada tagada 🍓', 'Je voulais raconter une blague sur le chômage… mais ça ne marche pas pour moi 😅', 'Quel est le comble pour un électricien ? De ne pas être au courant 💡', 'Pourquoi les poissons détestent l\'ordinateur ? À cause du net 🐟', 'Un crocodile qui surveille la pharmacie ? Un Lacoste garde 🐊', 'Qu\'est-ce qui est jaune et qui attend ? Jonathan 🍌', 'Pourquoi le livre de maths est triste ? Il a trop de problèmes 📘'],
  quote: [['La vie est un défi, relève-le.', 'Mère Teresa'], ['Le succès, c\'est tomber sept fois et se relever huit.', 'Proverbe japonais'], ['Sois le changement que tu veux voir dans le monde.', 'Gandhi'], ['Ce qui ne me tue pas me rend plus fort.', 'Nietzsche'], ['Rien n\'est impossible à celui qui essaie.', 'Alexandre le Grand'], ['La simplicité est la sophistication suprême.', 'Léonard de Vinci']],
  fact: ['Le miel ne se périme jamais 🍯', 'Les poulpes ont trois cœurs 🐙', 'La Terre n\'est pas parfaitement ronde 🌍', 'Un éclair est cinq fois plus chaud que la surface du Soleil ⚡', 'Les bananes sont des baies, pas les fraises 🍌', 'Le cœur d\'une crevette est dans sa tête 🦐'],
  riddle: [['Je parle sans bouche et j\'entends sans oreilles. Qui suis-je ?', 'L\'écho'], ['Plus on m\'enlève, plus je grandis. Qui suis-je ?', 'Un trou'], ['Qu\'est-ce qui monte mais ne redescend jamais ?', 'L\'âge'], ['J\'ai des villes mais pas de maisons, des rivières mais pas d\'eau. Qui suis-je ?', 'Une carte']],
  truth: ['Quel est ton plus grand secret ?', 'Quelle est ta plus grosse honte ?', 'Qui est ton crush en ce moment ?', 'Quel est le dernier mensonge que tu as dit ?', 'Quelle est ta plus grande peur ?'],
  dare: ['Envoie un vocal en chantant 🎤', 'Change ta photo de profil pendant 1h 🤳', 'Écris « je suis un génie » dans le groupe 😎', 'Appelle un ami et dis-lui bonjour en rimes 📞', 'Fais 10 pompes et envoie la preuve 💪'],
  ball: ['Oui, absolument ✅', 'Non, certainement pas ❌', 'Peut-être… 🤔', 'Très probable 👍', 'Demande plus tard ⏳', 'Je ne pense pas 😕', 'Sans aucun doute 💯', 'Les signes disent oui ✨'],
  wyr: [['Voyager dans le passé', 'Voyager dans le futur'], ['Être riche et seul', 'Être pauvre et entouré'], ['Savoir parler toutes les langues', 'Jouer de tous les instruments'], ['Ne plus jamais dormir', 'Ne plus jamais manger']],
  nhie: ['Je n\'ai jamais menti à mes parents 😅', 'Je n\'ai jamais ri en classe pour rien 😂', 'Je n\'ai jamais envoyé un message au mauvais contact 📱', 'Je n\'ai jamais dormi en cours 😴'],
  roast: ['Tu es la preuve que même la nature fait des brouillons 🔥', 'Ton Wi-Fi a plus de personnalité que toi 📶', 'Tu as le charisme d\'un chargeur débranché 🔌', 'Même ton ombre prend ses distances 🌑'],
  compliment: ['Ton sourire illumine toutes les pièces 🌹', 'Tu es plus précieux(se) que tu ne le crois ✨', 'Ton énergie est contagieuse 💫', 'Tu as un cœur en or 💛'],
  flirt: ['Tu crois au coup de foudre ou je dois repasser ? 😘', 'Tu dois être un hotspot : j\'ai une connexion avec toi 📶❤️', 'Je ne suis pas photographe, mais je te vois bien dans mon futur 📸']
};
const sm = (c) => (c.target ? '@' + num(c.target) : c.pushName);

// ---------- Handlers ----------
const H = {};
const def = (n, fn) => { H[n] = fn; };
const needArgs = (c, usage) => [['Usage', c.prefix + usage], ['Statut', 'Argument manquant']];
const groupOnly = [['Statut', 'Commande réservée aux groupes']];
const adminOnly = [['Statut', 'Réservé aux admins']];

// --- GÉNÉRAL ---
def('menu', async (c) => ({ text: menuText(c.ctx), img: IMG.menu }));
def('ping', async (c) => { const l = Math.max(1, Date.now() - Number(c.msg.messageTimestamp || 0) * 1000); c.ctx.latency = l; return { text: `Pong ! 🏓\nLatence : ${l} ms\n\n${SIG}` }; });
def('help', async () => ({ text: `❓ Tape .menu pour voir le menu du bot et utiliser les commandes merci ☺️\n\n${SIG}` }));
const sys = (c) => ({ uptime: fmtUp(process.uptime()), latency: c.ctx.latency || Math.max(1, Date.now() - Number(c.msg.messageTimestamp || 0) * 1000) });
def('info', async (c) => { const s = sys(c); return [['Nom', c.cfg.botName], ['Version', VERSION], ['Owner', OWNER_NAME], ['Préfixe', c.prefix], ['Plateforme', 'WhatsApp'], ['Uptime', s.uptime], ['Latence', s.latency + ' ms'], ['Commandes', TOTAL]]; });
def('speed', async (c) => { const t = Date.now(); const s = sys(c); return [['Latence', s.latency + ' ms'], ['Temps de traitement', (Date.now() - t) + ' ms'], ['État', s.latency < 1500 ? 'Rapide ⚡' : 'Normal']]; });
def('uptime', async (c) => [['Actif depuis', fmtUp(process.uptime())], ['Démarrage', new Date(c.ctx.startTime).toLocaleString('fr-FR')]]);
def('owner', async (c) => [['Nom', 'Kira'], ['Numéro', c.cfg.owner], ['Contact', 'wa.me/' + c.cfg.owner]]);
def('stats', async (c) => [['Utilisateurs', c.db.users.length], ['Groupes', Object.keys(c.db.groups).length], ['Commandes exécutées', c.db.stats.commands], ['Messages traités', c.db.stats.messages], ['Uptime', fmtUp(process.uptime())]]);
def('report', async (c) => ['Envoie :', 'La commande utilisée', 'La description du bug', 'Une capture ou le message d\'erreur', ['Contact', c.cfg.support]]);
def('feedback', async (c) => ['Envoie ton avis ou ta suggestion à :', 'wa.me/' + c.cfg.owner, 'Merci pour ton retour !']);
def('support', async (c) => [['Groupe', c.cfg.waGroup], ['Owner', 'wa.me/' + c.cfg.owner], ['Email', c.cfg.email]]);
def('rules', async () => [['1', 'Pas de spam 🚫'], ['2', 'Respecter les admins 🎉'], ['3', 'Pas de contenu illégal 💀'], ['4', 'Pas d\'abus de commandes ⚠️']].map(([a, b]) => `${a}. ${b}`));
def('about', async (c) => [['Nom', c.cfg.botName], ['Description', 'Bot multifonction WhatsApp'], ['Owner', OWNER_NAME], ['Version', VERSION]]);
def('version', async () => [['Version', VERSION], ['Build', BUILD], ['Dernière mise à jour', LAST_UPDATE]]);
def('changelog', async () => [['v' + VERSION, 'Version initiale : ' + TOTAL + ' commandes'], ['Mise à jour', LAST_UPDATE]]);
def('donate', async (c) => [['Moyen', 'Mobile Money / PayPal / Crypto'], ['Lien', c.cfg.support], 'Merci pour ton soutien !']);
def('premium', async (c) => [['Prix', '5$ / mois'], ['Avantages', 'Accès illimité, anti-ban, priorité, outils, panels commandes'], ['Contact', 'wa.me/' + c.cfg.owner]]);
def('status', async (c) => [['Bot', 'Online'], ['Base de données', 'Connected'], ['API', 'OK'], ['Latence', sys(c).latency + ' ms']]);
def('runtime', async () => [['Processus', fmtUp(process.uptime())], ['Système', fmtUp(os.uptime())], ['Mémoire', Math.round(process.memoryUsage().rss / 1048576) + ' MB']]);
def('shard', async (c) => [['Shard', '0/1'], ['Statut', 'READY'], ['Latence', sys(c).latency + ' ms']]);
def('credits', async () => [['Dev', 'Kira Tech'], ['Librairie', 'Baileys'], ['Inspirations', 'Kira Tech']]);
def('botinfo', async (c) => [['Nom', c.cfg.botName], ['Version', VERSION], ['Owner', OWNER_NAME], ['Node', process.version], ['Hébergement', 'Render'], ['Uptime', fmtUp(process.uptime())]]);
def('id', async (c) => [['ID', c.jid], ['Type', c.isGroup ? 'group' : 'private']]);
def('myid', async (c) => [['ID', c.sender], ['Nom', c.pushName]]);
def('profile', async (c) => {
  const u = c.db.userStats[num(c.sender)] || {};
  let img; try { img = await c.sock.profilePictureUrl(c.sender, 'image'); } catch (e) { img = c.cfg.botImg; }
  return { img, rows: [['Nom', c.pushName], ['ID', c.sender], ['Premium', c.db.premium && c.db.premium.includes(num(c.sender)) ? 'Oui' : 'Non'], ['Commandes utilisées', u.cmds || 0], ['Depuis', u.first ? new Date(u.first).toLocaleDateString('fr-FR') : 'Aujourd\'hui']] };
});

// --- GROUP ---
const needGroup = (fn) => async (c) => { if (!c.isGroup) return groupOnly; return fn(c); };
const needAdmin = (fn) => needGroup(async (c) => { if (!c.isAdmin && !c.isOwner) return adminOnly; return fn(c); });
const tryDo = async (fn) => { try { await fn(); return OK; } catch (e) { return KO + ' (le bot doit être admin)'; } };
const admins = (c) => c.meta.participants.filter((p) => p.admin);
const mentionsOf = (l) => l.map((p) => '@' + num(p.id)).join(' ');

def('tagall', needAdmin(async (c) => { const all = c.meta.participants.map((p) => p.id); c.mentions = all; return { img: IMG.tagall, rows: [['Mention', '@tous'], ['Groupe', c.meta.subject], ['Par', c.pushName], ['Membres', all.map((j) => '@' + num(j)).join(' ')]] }; }));
def('kick', needAdmin(async (c) => { if (!c.target) return needArgs(c, 'kick @membre'); c.mentions = [c.target]; const st = await tryDo(() => c.sock.groupParticipantsUpdate(c.jid, [c.target], 'remove')); return [['Cible', '@' + num(c.target)], ['Par', c.pushName], ['Statut', st]]; }));
def('kickall', needAdmin(async (c) => { const list = c.meta.participants.filter((p) => !p.admin && num(p.id) !== num(c.sock.user.id)).map((p) => p.id); const st = await tryDo(async () => { for (let i = 0; i < list.length; i += 10) { await c.sock.groupParticipantsUpdate(c.jid, list.slice(i, i + 10), 'remove'); await new Promise((r) => setTimeout(r, 1500)); } }); return { img: IMG.kickall, rows: [['Nombres', list.length + ' membres'], ['Exécuté par', c.pushName], ['Statut', st]] }; }));
def('promote', needAdmin(async (c) => { if (!c.target) return needArgs(c, 'promote @membre'); c.mentions = [c.target]; await tryDo(() => c.sock.groupParticipantsUpdate(c.jid, [c.target], 'promote')); return [['Cible', '@' + num(c.target)], ['Nouveau rôle', 'Admin'], ['Par', c.pushName]]; }));
def('demote', needAdmin(async (c) => { if (!c.target) return needArgs(c, 'demote @membre'); c.mentions = [c.target]; await tryDo(() => c.sock.groupParticipantsUpdate(c.jid, [c.target], 'demote')); return [['Cible', '@' + num(c.target)], ['Nouveau rôle', 'Membre'], ['Par', c.pushName]]; }));
def('mute', needAdmin(async (c) => { await tryDo(() => c.sock.groupSettingUpdate(c.jid, 'announcement')); return [['Groupe', c.meta.subject], ['Statut', 'Fermé'], ['Par', c.pushName]]; }));
def('unmute', needAdmin(async (c) => { await tryDo(() => c.sock.groupSettingUpdate(c.jid, 'not_announcement')); return [['Groupe', c.meta.subject], ['Statut', 'Ouvert'], ['Par', c.pushName]]; }));
const onoff = (c) => { const a = (c.args[0] || '').toLowerCase(); return ['on', 'oui', 'enable', '1'].includes(a) ? true : ['off', 'non', 'disable', '0'].includes(a) ? false : null; };
const toggle = (name, key, extra) => def(name, needAdmin(async (c) => {
  const g = c.group; const v = onoff(c); if (v !== null) { g[key] = v; c.save(); }
  const rows = [['Statut', g[key] ? 'Activé ✅' : 'Désactivé ❌']].concat(extra ? extra(c, g) : []);
  if (v === null) rows.push(['Usage', `${c.prefix}${name} on/off`]);
  return IMG[name] ? { img: IMG[name], rows } : rows;
}));
def('antilink', needAdmin(async (c) => {
  const g = c.group; const v = onoff(c); if (v !== null) g.antilink = v;
  if (['delete', 'kick'].includes((c.args[1] || '').toLowerCase())) g.antilinkAction = c.args[1].toLowerCase();
  c.save(); return { img: IMG.antilink, rows: [['Statut', g.antilink ? 'Activé ✅' : 'Désactivé ❌'], ['Action', g.antilinkAction || 'kick'], ['Usage', c.prefix + 'antilink on/off [delete|kick]']] };
}));
def('welcome', needAdmin(async (c) => { const g = c.group; const v = onoff(c); if (v !== null) g.welcome = v; else if (c.args.length) g.welcomeMsg = c.args.join(' '); c.save(); return [['Statut', g.welcome === false ? 'Désactivé ❌' : 'Activé ✅'], ['Message', g.welcomeMsg || 'Message par défaut']]; }));
def('goodbye', needAdmin(async (c) => { const g = c.group; const v = onoff(c); if (v !== null) g.goodbye = v; else if (c.args.length) g.goodbyeMsg = c.args.join(' '); c.save(); return [['Statut', g.goodbye === false ? 'Désactivé ❌' : 'Activé ✅'], ['Message', g.goodbyeMsg || 'Message par défaut']]; }));
def('groupinfo', needGroup(async (c) => { let img; try { img = await c.sock.profilePictureUrl(c.jid, 'image'); } catch (e) { img = c.cfg.botImg; } return { img, rows: [['Nom', c.meta.subject], ['ID', c.jid], ['Membres', c.meta.participants.length], ['Admins', admins(c).length], ['Créé le', new Date((c.meta.creation || 0) * 1000).toLocaleDateString('fr-FR')]] }; }));
const adminList = (n) => needGroup(async (c) => { const a = admins(c); c.mentions = a.map((p) => p.id); return [['Admins', mentionsOf(a)], ['Total', a.length]]; });
def('admin', adminList('admin')); def('listadmin', adminList('listadmin'));
def('tagadmin', needGroup(async (c) => { const a = admins(c); c.mentions = a.map((p) => p.id); return { img: IMG.tagadmin, rows: [['Admins taggés', a.length], ['Par', c.pushName], ['Liste', mentionsOf(a)]] }; }));
def('setdesc', needAdmin(async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'setdesc texte'); return [['Nouvelle description', t], ['Statut', await tryDo(() => c.sock.groupUpdateDescription(c.jid, t))]]; }));
def('setname', needAdmin(async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'setname texte'); return [['Nouveau nom', t], ['Statut', await tryDo(() => c.sock.groupUpdateSubject(c.jid, t))]]; }));
def('promoteall', needAdmin(async (c) => { const l = c.meta.participants.filter((p) => !p.admin).map((p) => p.id); const st = await tryDo(async () => { for (let i = 0; i < l.length; i += 10) await c.sock.groupParticipantsUpdate(c.jid, l.slice(i, i + 10), 'promote'); }); return { img: IMG.promoteall, rows: [['Cibles', l.length + ' membres'], ['Statut', st]] }; }));
def('demoteall', needAdmin(async (c) => { const l = admins(c).filter((p) => p.admin !== 'superadmin' && num(p.id) !== num(c.sock.user.id)).map((p) => p.id); const st = await tryDo(async () => { for (let i = 0; i < l.length; i += 10) await c.sock.groupParticipantsUpdate(c.jid, l.slice(i, i + 10), 'demote'); }); return [['Cibles', l.length + ' admins'], ['Statut', st]]; }));
def('add', needAdmin(async (c) => { const n = (c.args[0] || '').replace(/\D/g, ''); if (!n) return needArgs(c, 'add 242XXXXXXXX'); return [['Numéro', '+' + n], ['Statut', await tryDo(() => c.sock.groupParticipantsUpdate(c.jid, [n + '@s.whatsapp.net'], 'add'))]]; }));
def('leave', needAdmin(async (c) => { await c.send(fmt('leave', [['Groupe', c.meta.subject], ['Statut', OK]])); await c.sock.groupLeave(c.jid).catch(() => {}); return null; }));
def('revoke', needAdmin(async (c) => ['Nouveau lien généré', ['Statut', await tryDo(() => c.sock.groupRevokeInvite(c.jid))]]));
def('resetlink', needAdmin(async (c) => { let o = '', n = ''; const st = await tryDo(async () => { o = 'https://chat.whatsapp.com/' + await c.sock.groupInviteCode(c.jid); const code = await c.sock.groupRevokeInvite(c.jid); n = 'https://chat.whatsapp.com/' + code; }); return [['Ancien lien', o || '—'], ['Nouveau lien', n || st]]; }));
def('linkgc', needGroup(async (c) => { let l = ''; const st = await tryDo(async () => { l = 'https://chat.whatsapp.com/' + await c.sock.groupInviteCode(c.jid); }); return [['Lien', l || st]]; }));
def('setppgc', needAdmin(async (c) => { const buf = await c.mediaBuf('image'); if (!buf) return needArgs(c, 'setppgc (répondre à une image)'); return ['Photo mise à jour', ['Statut', await tryDo(() => c.sock.updateProfilePicture(c.jid, buf))]]; }));
def('setpgroup', needAdmin(async (c) => { const a = (c.args[0] || '').toLowerCase(); const map = { open: 'not_announcement', close: 'announcement', lock: 'locked', unlock: 'unlocked' }; if (!map[a]) return [['Paramètres', 'open | close | lock | unlock'], ['Statut', 'Argument manquant']]; return [['Paramètres', a], ['Statut', await tryDo(() => c.sock.groupSettingUpdate(c.jid, map[a]))]]; }));
toggle('antispam', 'antispam', (c, g) => { if (+c.args[1]) { g.spamThreshold = +c.args[1]; c.save(); } return [['Seuil', (g.spamThreshold || 6) + ' msgs / 10s']]; });
toggle('antibot', 'antibot', () => [['Action', 'kick']]);
toggle('antidelete', 'antidelete');
toggle('antitag', 'antitag');
toggle('nsfw', 'nsfw');
toggle('antinsfw', 'antinsfw');
toggle('captcha', 'captcha', (c, g) => { if (['strict', 'light'].includes(c.args[1])) { g.captchaMode = c.args[1]; c.save(); } return [['Mode', g.captchaMode || 'light']]; });
toggle('antiflood', 'antiflood', (c, g) => { if (+c.args[1]) { g.floodLimit = +c.args[1]; c.save(); } return [['Limite', (g.floodLimit || 6) + ' msgs / 10s']]; });
def('approve', needAdmin(async (c) => { const t = c.target ? [c.target] : (await c.sock.groupRequestParticipantsList(c.jid).catch(() => [])).map((x) => x.jid); await tryDo(() => c.sock.groupRequestParticipantsUpdate(c.jid, t, 'approve')); c.mentions = c.target ? [c.target] : []; return [['Cible', c.target ? '@' + num(c.target) : t.length + ' demande(s)'], ['Statut', 'Approuvé']]; }));
def('reject', needAdmin(async (c) => { const t = c.target ? [c.target] : (await c.sock.groupRequestParticipantsList(c.jid).catch(() => [])).map((x) => x.jid); await tryDo(() => c.sock.groupRequestParticipantsUpdate(c.jid, t, 'reject')); c.mentions = c.target ? [c.target] : []; return [['Cible', c.target ? '@' + num(c.target) : t.length + ' demande(s)'], ['Statut', 'Rejeté']]; }));
def('listmembers', needGroup(async (c) => { c.mentions = c.meta.participants.map((p) => p.id); return { img: IMG.listmembers, rows: [['Membres', mentionsOf(c.meta.participants)], ['Total', c.meta.participants.length]] }; }));
def('count', needGroup(async (c) => [['Membres', c.meta.participants.length], ['Admins', admins(c).length], ['Total messages', Object.keys(c.db.seen[c.jid] || {}).length ? c.db.stats.messages : c.db.stats.messages]]));

// --- ADMIN / MODÉRATION ---
const gb = (c) => { c.db.bans[c.jid] = c.db.bans[c.jid] || []; return c.db.bans[c.jid]; };
def('ban', needAdmin(async (c) => { if (!c.target) return needArgs(c, 'ban @membre raison'); c.mentions = [c.target]; const l = gb(c); if (!l.includes(num(c.target))) l.push(num(c.target)); c.save(); await tryDo(() => c.sock.groupParticipantsUpdate(c.jid, [c.target], 'remove')); return [['Cible', '@' + num(c.target)], ['Par', c.pushName], ['Raison', c.args.slice(1).join(' ') || 'Non précisée']]; }));
def('unban', needAdmin(async (c) => { if (!c.target) return needArgs(c, 'unban @membre'); c.mentions = [c.target]; c.db.bans[c.jid] = gb(c).filter((x) => x !== num(c.target)); c.save(); return [['Cible', '@' + num(c.target)], ['Par', c.pushName]]; }));
const warnKey = (c) => c.jid + ':' + num(c.target);
def('warn', needAdmin(async (c) => { if (!c.target) return needArgs(c, 'warn @membre raison'); c.mentions = [c.target]; const k = warnKey(c); const max = c.group.maxWarn || 3; const reason = c.args.slice(1).join(' ') || 'Non précisée'; const w = (c.db.warns[k] = c.db.warns[k] || []); w.push(reason); c.save(); if (w.length >= max) { await tryDo(() => c.sock.groupParticipantsUpdate(c.jid, [c.target], 'remove')); c.db.warns[k] = []; } return [['Cible', '@' + num(c.target)], ['Warns', `${w.length >= max ? max : w.length}/${max}`], ['Raison', reason]]; }));
def('unwarn', needAdmin(async (c) => { if (!c.target) return needArgs(c, 'unwarn @membre'); c.mentions = [c.target]; const w = c.db.warns[warnKey(c)] || []; w.pop(); c.db.warns[warnKey(c)] = w; c.save(); return [['Cible', '@' + num(c.target)], ['Warns restants', w.length]]; }));
def('warnings', needGroup(async (c) => { const t = c.target || c.sender; c.target = t; c.mentions = [t]; const w = c.db.warns[c.jid + ':' + num(t)] || []; return { img: IMG.warnings, rows: [['Cible', '@' + num(t)], ['Total', w.length], ['Liste', w.length ? w.map((x, i) => `${i + 1}) ${x}`).join(' | ') : 'Aucun']] }; }));
def('resetwarn', needAdmin(async (c) => { if (!c.target) return needArgs(c, 'resetwarn @membre'); c.mentions = [c.target]; c.db.warns[warnKey(c)] = []; c.save(); return [['Cible', '@' + num(c.target)], ['Statut', 'Réinitialisé']]; }));
def('block', async (c) => { if (!c.isOwner) return adminOnly; const t = c.target || (c.isGroup ? null : c.jid); if (!t) return needArgs(c, 'block @membre'); c.mentions = [t]; await tryDo(() => c.sock.updateBlockStatus(t, 'block')); return [['Cible', '@' + num(t)], ['Statut', 'Bloqué']]; });
def('unblock', async (c) => { if (!c.isOwner) return adminOnly; const t = c.target || (c.isGroup ? null : c.jid); if (!t) return needArgs(c, 'unblock @membre'); c.mentions = [t]; await tryDo(() => c.sock.updateBlockStatus(t, 'unblock')); return [['Cible', '@' + num(t)], ['Statut', 'Débloqué']]; });
def('blacklist', async (c) => { if (!c.isOwner) return adminOnly; const t = c.target || (!c.isGroup && c.jid); if (!t) return needArgs(c, 'blacklist @membre'); c.mentions = [t]; if (!c.db.blacklist.includes(num(t))) c.db.blacklist.push(num(t)); c.save(); return [['Cible', '@' + num(t)], ['Statut', 'Ajouté']]; });
def('whitelist', async (c) => { if (!c.isOwner) return adminOnly; const t = c.target || (!c.isGroup && c.jid); if (!t) return needArgs(c, 'whitelist @membre'); c.mentions = [t]; c.db.blacklist = c.db.blacklist.filter((x) => x !== num(t)); if (!c.db.whitelist.includes(num(t))) c.db.whitelist.push(num(t)); c.save(); return [['Cible', '@' + num(t)], ['Statut', 'Ajouté']]; });
def('purge', needAdmin(async (c) => { const days = +c.args[0] || 7; const seen = c.db.seen[c.jid] || {}; const lim = Date.now() - days * 86400000; const l = c.meta.participants.filter((p) => !p.admin && num(p.id) !== num(c.sock.user.id) && (!seen[p.id] || seen[p.id] < lim)).map((p) => p.id); let n = 0; await tryDo(async () => { for (let i = 0; i < l.length; i += 10) { await c.sock.groupParticipantsUpdate(c.jid, l.slice(i, i + 10), 'remove'); n += l.slice(i, i + 10).length; await new Promise((r) => setTimeout(r, 1500)); } }); return { img: IMG.purge, rows: [['Nombre de menbres supprimés', n], ['Par', c.pushName]] }; }));
def('setwarn', needAdmin(async (c) => { if (+c.args[0] > 0) { c.group.maxWarn = +c.args[0]; c.save(); } return [['Limite', c.group.maxWarn || 3], ['Statut', OK]]; }));
def('setprefix', async (c) => { if (!c.isOwner) return adminOnly; const n = c.args[0]; if (!n || n.length > 3) return needArgs(c, 'setprefix !'); const o = c.prefix; c.db.prefix = n; c.save(); return [['Ancien', o], ['Nouveau', n]]; });
def('lock', needAdmin(async (c) => { await tryDo(() => c.sock.groupSettingUpdate(c.jid, 'locked')); return [['Groupe', c.meta.subject], ['Statut', 'Verrouillé']]; }));
def('unlock', needAdmin(async (c) => { await tryDo(() => c.sock.groupSettingUpdate(c.jid, 'unlocked')); return [['Groupe', c.meta.subject], ['Statut', 'Déverrouillé']]; }));
def('slowmode', needAdmin(async (c) => { const s = +c.args[0]; if (c.args[0] !== undefined) { c.group.slowmode = s > 0 ? s : 0; c.save(); } return [['Intervalle', (c.group.slowmode || 0) + 's'], ['Statut', c.group.slowmode ? 'Activé ✅' : 'Désactivé ❌']]; }));
def('setlang', needAdmin(async (c) => { if (['fr', 'en'].includes(c.args[0])) { c.group.lang = c.args[0]; c.save(); } return [['Langue', c.group.lang || 'fr'], ['Statut', OK]]; }));
def('settimezone', needAdmin(async (c) => { const z = c.args[0]; if (z) { try { new Intl.DateTimeFormat('fr', { timeZone: z }); c.group.tz = z; c.save(); } catch (e) { return [['Fuseau', z], ['Statut', KO]]; } } return [['Fuseau', c.group.tz || 'Africa/Lome'], ['Statut', OK]]; }));

// --- FUN ---
const pct = (c) => { const h = crypto.createHash('md5').update(String(c.target || c.args.join(' ') || c.sender)).digest(); return h[0] % 101; };
def('joke', async () => [pick(D.joke)]);
def('meme', async () => { try { const m = await J('https://meme-api.com/gimme'); return { img: m.url, rows: [m.title, ['Source', 'r/' + m.subreddit]] }; } catch (e) { return [`Meme du jour : « Quand le code marche du premier coup »`, ['Source', 'Kira Tech']]; } });
def('quote', async () => { const q = pick(D.quote); return [`"${q[0]}"`, `— ${q[1]}`]; });
def('fact', async () => [pick(D.fact)]);
def('riddle', async () => { const r = pick(D.riddle); return [r[0], ['Réponse', '||' + r[1] + '||']]; });
def('truth', async () => [pick(D.truth)]);
def('dare', async () => [pick(D.dare)]);
def('8ball', async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, '8ball ta question ?'); return [['Question', q], ['Réponse', pick(D.ball)]]; });
def('ship', async (c) => { const a = c.mentioned[0] ? '@' + num(c.mentioned[0]) : (c.args[0] || c.pushName); const b = c.mentioned[1] ? '@' + num(c.mentioned[1]) : (c.args[1] || 'Mystère'); c.mentions = c.mentioned; const p = crypto.createHash('md5').update(a + b).digest()[0] % 101; return [`${a} + ${b}`, ['Score', p + '%'], p > 70 ? 'Un couple parfait 💞' : p > 40 ? 'Il y a du potentiel 😉' : 'Pas vraiment compatibles 😅']; });
def('rate', async (c) => [['Cible', sm(c) === c.pushName && c.args.length ? c.args.join(' ') : sm(c)], ['Note', rnd(1, 10) + '/10']]);
def('gay', async (c) => { if (c.target) c.mentions = [c.target]; return [['Cible', sm(c)], ['Résultat', pct(c) + '%']]; });
def('simp', async (c) => { if (c.target) c.mentions = [c.target]; return [['Cible', sm(c)], ['Résultat', pct(c) + '%']]; });
def('pp', async (c) => { if (c.target) c.mentions = [c.target]; return [['Cible', sm(c)], ['Taille', rnd(3, 25) + ' cm']]; });
def('iq', async (c) => { if (c.target) c.mentions = [c.target]; return [['Cible', sm(c)], ['QI', rnd(60, 180)]]; });
def('dice', async () => [['Résultat', '🎲 ' + rnd(1, 6)]]);
def('coin', async () => [['Résultat', pick(['Pile 🪙', 'Face 🪙'])]]);
def('slot', async () => { const s = ['🍒', '🍋', '🍉', '⭐', '💎', '7️⃣']; const a = pick(s), b = pick(s), d = pick(s); return [`${a} | ${b} | ${d}`, ['Résultat', a === b && b === d ? 'JACKPOT 🎉' : a === b || b === d || a === d ? 'Presque ! 😮' : 'Perdu 😢']]; });
def('wyr', async () => { const w = pick(D.wyr); return [w[0], 'OU', w[1]]; });
def('nhie', async () => [pick(D.nhie)]);
def('random', async (c) => { const o = c.args.join(' ').split(/[,|]/).map((s) => s.trim()).filter(Boolean); return [['Résultat', o.length > 1 ? pick(o) : rnd(1, +c.args[0] || 100)]]; });
def('lovecalc', async (c) => { const a = c.mentioned[0] ? '@' + num(c.mentioned[0]) : (c.args[0] || c.pushName); const b = c.mentioned[1] ? '@' + num(c.mentioned[1]) : (c.args[1] || 'Mystère'); c.mentions = c.mentioned; return [`${a} + ${b}`, ['Amour', crypto.createHash('md5').update(a + b).digest()[0] % 101 + '%']]; });
def('flirt', async () => ({ img: IMG.flirt, rows: [pick(D.flirt)] }));
def('roast', async (c) => { if (c.target) c.mentions = [c.target]; return [['Cible', sm(c)], pick(D.roast)]; });
def('compliment', async (c) => { if (c.target) c.mentions = [c.target]; return { img: IMG.compliment, rows: [['Cible', sm(c)], pick(D.compliment)] }; });
def('reverse', async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'reverse texte'); return [['Original', t], ['Inversé', [...t].reverse().join('')]]; });

// --- MÉDIA / STICKER ---
const svgImg = async (w, h, body, bg) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}</svg>`));
const wrapLines = (t, n) => { const out = []; let l = ''; for (const w of String(t).split(/\s+/)) { if ((l + ' ' + w).trim().length > n) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); return out.slice(0, 8); };
const textImg = async (t, fg, bg, size = 512) => { const lines = wrapLines(t, 14); const fs = Math.min(70, Math.floor(size / (lines.length + 1))); const body = lines.map((l, i) => `<text x="50%" y="${(i + 1) * (size / (lines.length + 1))}" font-size="${fs}" font-family="sans-serif" font-weight="bold" fill="${fg}" text-anchor="middle">${esc(l)}</text>`).join(''); return svgImg(size, size, body, bg); };
const stk = async (c, sharpObj) => c.sock.sendMessage(c.jid, { sticker: await sharpObj.webp().toBuffer() }, { quoted: c.msg });
def('image', async (c) => { try { const q = c.args.join(' '); let url; try { url = (await J('https://api.waifu.pics/sfw/waifu')).url; } catch (e) { url = c.cfg.botImg; } return { img: url, rows: [['Recherche', q || 'manga'], ['Résultat', OK]] }; } catch (e) { return [['Résultat', KO]]; } });
def('giff', async (c) => { const buf = await c.mediaBuf('video'); const q = c.args.join(' ') || 'dance'; if (buf) { await c.sock.sendMessage(c.jid, { video: buf, gifPlayback: true }, { quoted: c.msg }); return [['Recherche', q], ['Résultat', OK]]; } try { const g = (await J('https://api.waifu.pics/sfw/' + (['hug', 'kiss', 'pat', 'slap', 'cry', 'smile', 'wave', 'dance', 'happy'].includes(q) ? q : 'dance'))).url; await c.sock.sendMessage(c.jid, { video: { url: g }, gifPlayback: true }, { quoted: c.msg }); return [['Recherche', q], ['Résultat', OK]]; } catch (e) { return [['Recherche', q], ['Résultat', KO]]; } });
def('sticker', async (c) => { if (!sharp) return [['Source', '—'], ['Statut', KO]]; const buf = await c.mediaBuf('image'); if (!buf) return needArgs(c, 'sticker (répondre à une image)'); await stk(c, sharp(buf).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })); return [['Source', 'Image'], ['Statut', OK]]; });
def('vv', async (c) => { const q = c.quotedRaw; const inner = q && (q.viewOnceMessage || q.viewOnceMessageV2 || q.viewOnceMessageV2Extension); const m = inner && inner.message; const t = m && (m.imageMessage ? 'image' : m.videoMessage ? 'video' : m.audioMessage ? 'audio' : null); if (!t) return ['Média récupéré', ['Statut', 'Réponds à une vue unique']]; const buf = await B.downloadMediaMessage({ key: c.quotedKey, message: m }, 'buffer', {}); await c.sock.sendMessage(c.jid, { [t]: buf, ...(t === 'audio' ? { mimetype: 'audio/mp4' } : {}) }, { quoted: c.msg }); return ['Média récupéré', ['Statut', OK]]; });
def('toimg', async (c) => { if (!sharp) return ['Sticker converti en image', ['Statut', KO]]; const buf = await c.mediaBuf('sticker'); if (!buf) return ['Sticker converti en image', ['Statut', 'Réponds à un sticker']]; await c.sock.sendMessage(c.jid, { image: await sharp(buf).png().toBuffer() }, { quoted: c.msg }); return ['Sticker converti en image', ['Statut', OK]]; });
def('tovideo', async (c) => { const buf = await c.mediaBuf('video'); if (!buf) return [['Conversion', 'Réponds à une vidéo / un gif']]; await c.sock.sendMessage(c.jid, { video: buf, mimetype: 'video/mp4' }, { quoted: c.msg }); return [['Conversion', OK]]; });
def('toaudio', async (c) => { const buf = await c.mediaBuf('video') || await c.mediaBuf('audio'); if (!buf) return [['Conversion', 'Réponds à une vidéo / un audio']]; await c.sock.sendMessage(c.jid, { audio: buf, mimetype: 'audio/mp4' }, { quoted: c.msg }); return [['Conversion', OK]]; });
def('tourl', async (c) => { const buf = await c.mediaBuf('any'); if (!buf) return needArgs(c, 'tourl (répondre à un média)'); const fd = new FormData(); fd.append('reqtype', 'fileupload'); fd.append('fileToUpload', new Blob([buf]), 'file.' + (c.mediaExt || 'bin')); const r = await axios.post('https://catbox.moe/user/api.php', fd, { timeout: 60000 }); return [['Lien', String(r.data).trim()]]; });
def('attp', async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'attp texte'); if (!sharp) return [['Texte', t], ['Statut', KO]]; await stk(c, await textImg(t, pick(['#ff0055', '#00c8ff', '#ffd400', '#00e676']), '#000000')); return [['Texte', t], ['Statut', OK]]; });
def('ttp', async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'ttp texte'); if (!sharp) return [['Texte', t], ['Statut', KO]]; await stk(c, await textImg(t, '#ffffff', null)); return [['Texte', t], ['Statut', OK]]; });
def('emojimix', async (c) => { const [e1, e2] = c.args.join('').match(/\p{Extended_Pictographic}\uFE0F?/gu) || []; if (!e1 || !e2) return needArgs(c, 'emojimix 😀+😍'); let st = KO; try { const r = await J(`https://tenor.googleapis.com/v2/featured?key=AIzaSyACvEq5cnT7AcHpDYhZnXm3EtcwDhO7LGo&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(e1 + '_' + e2)}`); const u = r.results && r.results[0] && r.results[0].url; if (u && sharp) { await stk(c, sharp(await BUF(u)).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })); st = OK; } } catch (e) {} return [`${e1} + ${e2}`, ['Statut', st]]; });
def('take', async (c) => { const buf = await c.mediaBuf('sticker'); if (!buf) return [['Pack', c.args[0] || c.pushName], ['Auteur', c.args[1] || OWNER_NAME], ['Statut', 'Réponds à un sticker']]; await c.sock.sendMessage(c.jid, { sticker: buf }, { quoted: c.msg }); return [['Pack', c.args[0] || c.pushName], ['Auteur', c.args[1] || OWNER_NAME], ['Statut', OK]]; });
def('qc', async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'qc texte'); if (!sharp) return [['Texte', t], ['Statut', KO]]; const lines = wrapLines(t, 22); const body = `<rect x="20" y="120" width="472" height="${60 + lines.length * 44}" rx="28" fill="#1f2c34"/><text x="48" y="165" font-size="26" font-family="sans-serif" font-weight="bold" fill="#00e676">${esc(c.pushName)}</text>` + lines.map((l, i) => `<text x="48" y="${210 + i * 44}" font-size="32" font-family="sans-serif" fill="#fff">${esc(l)}</text>`).join(''); await stk(c, await svgImg(512, 512, body)); return [['Texte', t], ['Statut', OK]]; });
def('memeimg', async (c) => { const [top, bottom = ''] = c.args.join(' ').split('/').map((s) => s.trim()); if (!top) return needArgs(c, 'memeimg haut / bas (répondre à une image)'); let buf = await c.mediaBuf('image'); if (!buf || !sharp) return [`${top} / ${bottom}`, ['Statut', 'Réponds à une image']]; const base = await sharp(buf).resize(600, 600, { fit: 'cover' }).toBuffer(); const t = (y, s) => `<text x="300" y="${y}" font-size="52" font-family="Impact,sans-serif" font-weight="bold" fill="#fff" stroke="#000" stroke-width="3" text-anchor="middle">${esc(s.toUpperCase())}</text>`; const ov = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">${t(70, top)}${t(570, bottom)}</svg>`); await c.sock.sendMessage(c.jid, { image: await sharp(base).composite([{ input: ov }]).jpeg().toBuffer() }, { quoted: c.msg }); return [`${top} / ${bottom}`, ['Statut', OK]]; });
def('carbon', async (c) => { const code = c.args.join(' ') || (c.quotedText || ''); if (!code) return needArgs(c, 'carbon code'); if (!sharp) return ['Code généré', ['Statut', KO]]; const lines = code.split('\n').slice(0, 25); const h = 80 + lines.length * 28; const body = `<rect x="10" y="10" width="780" height="${h - 20}" rx="14" fill="#282a36"/><circle cx="40" cy="38" r="7" fill="#ff5f56"/><circle cx="64" cy="38" r="7" fill="#ffbd2e"/><circle cx="88" cy="38" r="7" fill="#27c93f"/>` + lines.map((l, i) => `<text x="34" y="${84 + i * 28}" font-size="20" font-family="monospace" fill="#f8f8f2" xml:space="preserve">${esc(l)}</text>`).join(''); await c.sock.sendMessage(c.jid, { image: await (await svgImg(800, h, body)).png().toBuffer() }, { quoted: c.msg }); return ['Code généré', ['Statut', OK]]; });
const shot = (name) => def(name, async (c) => { const u = c.args[0]; if (!/^https?:\/\//i.test(u || '')) return needArgs(c, name + ' https://site.com'); await c.sock.sendMessage(c.jid, { image: { url: 'https://image.thum.io/get/width/1280/crop/900/' + u } }, { quoted: c.msg }); return [['URL', u], ['Statut', OK]]; });
shot('ss'); shot('screenshot');
const imgOp = (name, rowsFn, op) => def(name, async (c) => { if (!sharp) return rowsFn(c, KO); const buf = await c.mediaBuf('image'); if (!buf) return rowsFn(c, 'Réponds à une image'); const out = await op(sharp(buf), c, buf); await c.sock.sendMessage(c.jid, { image: await out.png().toBuffer() }, { quoted: c.msg }); return rowsFn(c, OK); });
imgOp('resize', (c, s) => [['Dimensions', `${+c.args[0] || 512}x${+c.args[1] || +c.args[0] || 512}`], ['Statut', s]], (s, c) => s.resize(+c.args[0] || 512, +c.args[1] || +c.args[0] || 512, { fit: 'fill' }));
imgOp('blur', (c, s) => [['Statut', s]], (s, c) => s.blur(Math.min(50, Math.max(1, +c.args[0] || 8))));
imgOp('grayscale', (c, s) => [['Statut', s]], (s) => s.grayscale());
imgOp('invert', (c, s) => [['Statut', s]], (s) => s.negate());
imgOp('rotate', (c, s) => [['Angle', (+c.args[0] || 90) + '°'], ['Statut', s]], (s, c) => s.rotate(+c.args[0] || 90));
imgOp('crop', (c, s) => [['Dimensions', `${+c.args[0] || 512}x${+c.args[1] || +c.args[0] || 512}`], ['Statut', s]], async (s, c, buf) => { const m = await sharp(buf).metadata(); const w = Math.min(+c.args[0] || 512, m.width), h = Math.min(+c.args[1] || +c.args[0] || 512, m.height); return sharp(buf).extract({ left: Math.floor((m.width - w) / 2), top: Math.floor((m.height - h) / 2), width: w, height: h }); });
imgOp('circle', (c, s) => [['Statut', s]], async (s, c, buf) => { const sz = 512; const mask = Buffer.from(`<svg width="${sz}" height="${sz}"><circle cx="${sz / 2}" cy="${sz / 2}" r="${sz / 2}"/></svg>`); return sharp(await sharp(buf).resize(sz, sz, { fit: 'cover' }).toBuffer()).composite([{ input: mask, blend: 'dest-in' }]); });
def('removebg', async (c) => { const key = process.env.REMOVEBG_KEY; const buf = await c.mediaBuf('image'); if (!buf) return [['Statut', 'Réponds à une image']]; if (!key) return [['Statut', 'Service non configuré']]; const fd = new FormData(); fd.append('image_file', new Blob([buf]), 'a.png'); fd.append('size', 'auto'); const r = await axios.post('https://api.remove.bg/v1.0/removebg', fd, { headers: { 'X-Api-Key': key }, responseType: 'arraybuffer', timeout: 60000 }); await c.sock.sendMessage(c.jid, { image: Buffer.from(r.data) }, { quoted: c.msg }); return [['Statut', OK]]; });

// --- TÉLÉCHARGEMENT ---
const ytSearch = async (q) => { const html = await J('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), { responseType: 'text', headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr' } }); const id = (String(html).match(/"videoId":"([\w-]{11})"/) || [])[1]; const title = (String(html).match(/"title":\{"runs":\[\{"text":"([^"]+)"/) || [])[1] || q; return id ? { id, title, url: 'https://www.youtube.com/watch?v=' + id } : null; };
const ytGet = async (url, type) => { const eps = type === 'mp3' ? [`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`, `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`] : [`https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(url)}`, `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`]; for (const e of eps) { try { const r = await J(e); const d = r.result || r.data || {}; const dl = (d.download && (d.download.url || d.download)) || d.url || d.dl; if (dl && typeof dl === 'string') return { dl, title: d.title || (d.metadata && d.metadata.title) || 'media' }; } catch (er) {} } return null; };
const sendYT = (name, type, byQuery) => def(name, async (c) => {
  let input = c.args.join(' '); if (!input) return byQuery ? [['Recherche', '—'], ['Titre', '—'], ['Statut', 'Argument manquant']] : needArgs(c, name + ' lien');
  let url = input, title = '—';
  if (byQuery || !/^https?:\/\//i.test(input)) { const s = await ytSearch(input).catch(() => null); if (!s) return [['Recherche', input], ['Titre', '—'], ['Statut', KO]]; url = s.url; title = s.title; }
  const r = await ytGet(url, type);
  if (!r) return byQuery ? [['Recherche', input], ['Titre', title], ['Statut', KO]] : [['Lien', url], ['Titre', title], ['Statut', KO]];
  await c.sock.sendMessage(c.jid, type === 'mp3' ? { audio: { url: r.dl }, mimetype: 'audio/mpeg' } : { video: { url: r.dl }, caption: r.title }, { quoted: c.msg });
  const t = r.title || title;
  if (name === 'ytmp3') return [['Lien', url], ['Titre', t], ['Taille', '—'], ['Statut', OK]];
  if (name === 'ytmp4') return [['Lien', url], ['Titre', t], ['Qualité', '360p'], ['Statut', OK]];
  if (name === 'ytdl') return [['Lien', url], ['Format', type], ['Statut', OK]];
  return [['Recherche', input], ['Titre', t], ['Statut', OK]];
});
sendYT('ytmp3', 'mp3', false); sendYT('ytmp4', 'mp4', false); sendYT('ytdl', 'mp4', false);
sendYT('play', 'mp3', true); sendYT('video', 'mp4', true); sendYT('song', 'mp3', true);
sendYT('spotify', 'mp3', true); sendYT('soundcloud', 'mp3', true);
const social = (name, ep) => def(name, async (c) => {
  const u = c.args[0]; if (!/^https?:\/\//i.test(u || '')) return needArgs(c, name + ' lien');
  let st = KO;
  try {
    let media = null;
    if (name === 'tiktok') { const r = (await J('https://www.tikwm.com/api/?url=' + encodeURIComponent(u))).data; if (r) media = { video: { url: r.play }, caption: r.title || '' }; }
    else { const r = await J(`https://api.vreden.my.id/api/${ep}?url=${encodeURIComponent(u)}`); const d = r.result || r.data; const l = d && (d.data || d.result || d); const first = Array.isArray(l) ? l[0] : l; const link = first && (first.url || first.hd || first.sd || first.download); if (link) media = /\.(jpe?g|png|webp)/i.test(link) ? { image: { url: link } } : { video: { url: link } }; }
    if (media) { await c.sock.sendMessage(c.jid, media, { quoted: c.msg }); st = OK; }
  } catch (e) {}
  return [['Lien', u], ['Statut', st]];
});
social('instagram', 'igdl'); social('tiktok'); social('facebook', 'fbdl'); social('twitter', 'twitter');
def('pinterest', async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, 'pinterest recherche'); let st = KO; try { const r = await J('https://api.vreden.my.id/api/pinterest?query=' + encodeURIComponent(q)); const l = r.result || r.data || []; if (l.length) { await c.sock.sendMessage(c.jid, { image: { url: pick(l) } }, { quoted: c.msg }); st = OK; } } catch (e) {} return [['Recherche', q], ['Statut', st]]; });
def('imgur', async (c) => { const u = c.args[0]; if (!/^https?:\/\/(i\.)?imgur\.com/i.test(u || '')) return needArgs(c, 'imgur lien'); let st = KO; try { const id = u.split('/').pop().split('.')[0]; await c.sock.sendMessage(c.jid, { image: { url: `https://i.imgur.com/${id}.jpg` } }, { quoted: c.msg }); st = OK; } catch (e) {} return [['Lien', u], ['Statut', st]]; });
def('gdrive', async (c) => { const u = c.args[0]; const id = ((u || '').match(/[-\w]{25,}/) || [])[0]; if (!id) return needArgs(c, 'gdrive lien'); let st = KO; try { await c.sock.sendMessage(c.jid, { document: { url: 'https://drive.google.com/uc?export=download&id=' + id }, mimetype: 'application/octet-stream', fileName: 'gdrive-' + id }, { quoted: c.msg }); st = OK; } catch (e) {} return [['Lien', u], ['Statut', st]]; });
def('mediafire', async (c) => { const u = c.args[0]; if (!/mediafire\.com/i.test(u || '')) return needArgs(c, 'mediafire lien'); let st = KO; try { const html = await J(u, { responseType: 'text', headers: { 'User-Agent': 'Mozilla/5.0' } }); const dl = (String(html).match(/https?:\/\/download[^"']+/) || [])[0]; if (dl) { await c.sock.sendMessage(c.jid, { document: { url: dl }, mimetype: 'application/octet-stream', fileName: decodeURIComponent(dl.split('/').pop()) }, { quoted: c.msg }); st = OK; } } catch (e) {} return [['Lien', u], ['Statut', st]]; });
def('apk', async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, 'apk nom'); return [['Recherche', q], ['Résultat', 'https://apkpure.com/search?q=' + encodeURIComponent(q)]]; });
def('playstore', async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, 'playstore nom'); return [['Recherche', q], ['Résultat', 'https://play.google.com/store/search?q=' + encodeURIComponent(q) + '&c=apps']]; });
const omdb = (name) => def(name, async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, name + ' titre'); try { const r = await J('https://www.omdbapi.com/?apikey=trilogy&t=' + encodeURIComponent(q)); if (r.Response === 'False') return [['Recherche', q], ['Titre', 'Introuvable'], ['Note', '—']]; return { img: r.Poster && r.Poster !== 'N/A' ? r.Poster : undefined, rows: [['Recherche', q], ['Titre', `${r.Title} (${r.Year})`], ['Note', r.imdbRating + '/10']] }; } catch (e) { return [['Recherche', q], ['Titre', '—'], ['Note', '—']]; } });
omdb('imdb'); omdb('movie');
const wikiFn = (name) => def(name, async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, name + ' sujet'); try { const r = await J('https://fr.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q)); return [['Recherche', q], ['Résumé', (r.extract || 'Aucun résultat').slice(0, 700)]]; } catch (e) { return [['Recherche', q], ['Résumé', 'Aucun résultat']]; } });
wikiFn('wiki'); wikiFn('wiki2');

// --- RECHERCHE ---
const ddg = (name, label) => def(name, async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, name + ' recherche'); let res = 'https://www.google.com/search?q=' + encodeURIComponent(q); if (name === 'bing') res = 'https://www.bing.com/search?q=' + encodeURIComponent(q); try { const r = await J('https://api.duckduckgo.com/?format=json&no_html=1&q=' + encodeURIComponent(q)); if (r.AbstractText) res = r.AbstractText.slice(0, 500) + '\n' + (r.AbstractURL || res); } catch (e) {} return [['Recherche', q], ['Résultats', res]]; });
ddg('google'); ddg('bing');
def('youtube', async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, 'youtube recherche'); const s = await ytSearch(q).catch(() => null); return [['Recherche', q], ['Résultat', s ? s.title : 'Aucun'], ['Lien', s ? s.url : '—']]; });
def('weather', async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, 'weather ville'); try { const r = await J(`https://wttr.in/${encodeURIComponent(q)}?format=j1&lang=fr`); const cur = r.current_condition[0]; return [['Ville', q], ['Température', cur.temp_C + '°C'], ['Conditions', (cur.lang_fr && cur.lang_fr[0].value) || cur.weatherDesc[0].value], ['Humidité', cur.humidity + '%']]; } catch (e) { return [['Ville', q], ['Température', '—'], ['Conditions', 'Indisponible'], ['Humidité', '—']]; } });
def('news', async (c) => { const t = c.args.join(' ') || 'monde'; try { const x = await J('https://news.google.com/rss/search?hl=fr&gl=FR&ceid=FR:fr&q=' + encodeURIComponent(t), { responseType: 'text' }); const it = String(x).match(/<item>[\s\S]*?<\/item>/); const title = it && (it[0].match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1]; const src = it && (it[0].match(/<source[^>]*>(.*?)<\/source>/) || [])[1]; return [['Sujet', t], ['Titre', esc(title || 'Aucune actualité').replace(/&amp;/g, '&')], ['Source', src || '—']]; } catch (e) { return [['Sujet', t], ['Titre', 'Indisponible'], ['Source', '—']]; } });
const jikan = (name, kind, f) => def(name, async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, name + ' titre'); try { const r = (await J(`https://api.jikan.moe/v4/${kind}?limit=1&q=${encodeURIComponent(q)}`)).data[0]; return { img: r.images.jpg.image_url, rows: [['Recherche', q], ['Titre', r.title], [f[0], r[f[1]] || '?']] }; } catch (e) { return [['Recherche', q], ['Titre', 'Introuvable'], [f[0], '—']]; } });
jikan('anime', 'anime', ['Épisodes', 'episodes']); jikan('manga', 'manga', ['Chapitres', 'chapters']);
def('lyrics', async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'lyrics titre'); return [['Titre', t], ['Paroles', 'https://genius.com/search?q=' + encodeURIComponent(t)]]; });
def('define', async (c) => { const w = c.args[0]; if (!w) return needArgs(c, 'define mot'); try { const r = await J('https://api.dictionaryapi.dev/api/v2/entries/fr/' + encodeURIComponent(w)); return [['Mot', w], ['Définition', r[0].meanings[0].definitions[0].definition]]; } catch (e) { return [['Mot', w], ['Définition', 'Introuvable']]; } });
def('translate', async (c) => { const lang = c.args[0]; const t = c.args.slice(1).join(' ') || c.quotedText; if (!lang || !t) return needArgs(c, 'translate en texte'); try { const r = await J(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=Autodetect|${lang}`); return [['Texte', t], ['Langue', lang], ['Traduction', r.responseData.translatedText]]; } catch (e) { return [['Texte', t], ['Langue', lang], ['Traduction', 'Indisponible']]; } });
def('tts', async (c) => { const lang = /^[a-z]{2}$/.test(c.args[0] || '') ? c.args[0] : 'fr'; const t = (/^[a-z]{2}$/.test(c.args[0] || '') ? c.args.slice(1) : c.args).join(' '); if (!t) return needArgs(c, 'tts fr texte'); let st = KO; try { await c.sock.sendMessage(c.jid, { audio: { url: `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(t.slice(0, 190))}` }, mimetype: 'audio/mpeg', ptt: true }, { quoted: c.msg }); st = OK; } catch (e) {} return [['Texte', t], ['Langue', lang], ['Statut', st]]; });
def('stt', async () => ['Audio → Texte', ['Résultat', 'Service non configuré']]);
def('ghsearch', async (c) => { const q = c.args.join(' '); if (!q) return needArgs(c, 'ghsearch recherche'); try { const r = (await J('https://api.github.com/search/repositories?per_page=1&q=' + encodeURIComponent(q))).items[0]; return [['Recherche', q], ['Résultat', r ? `${r.full_name} ⭐${r.stargazers_count}\n${r.html_url}` : 'Aucun']]; } catch (e) { return [['Recherche', q], ['Résultat', 'Indisponible']]; } });

// --- AI ---
const aiCall = async (prompt, model) => String(await J(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model || 'openai'}`, { responseType: 'text' })).slice(0, 3500);
const aiCmd = (name, label, build, model) => def(name, async (c) => { const p = c.args.join(' ') || c.quotedText; if (!p) return needArgs(c, name + ' texte'); let r = 'Indisponible pour le moment'; try { r = await aiCall(build(p), model); } catch (e) { if (model) { try { r = await aiCall(build(p)); } catch (e2) {} } } return build.rows(p, r); });
const mk = (name, pre, rows, model) => { const b = (p) => pre + p; b.rows = rows; aiCmd(name, name, b, model); };
mk('ai', 'Réponds en français, clairement : ', (p, r) => [['Prompt', p], ['Réponse', r]]);
mk('gpt', 'Réponds en français : ', (p, r) => [['Modèle', 'GPT'], ['Prompt', p], ['Réponse', r]], 'openai-large');
mk('gemini', 'Réponds en français : ', (p, r) => [['Prompt', p], ['Réponse', r]], 'gemini');
mk('code', 'Écris uniquement le code demandé (avec très peu d\'explications) : ', (p, r) => [['Langage', 'auto'], ['Réponse', r]]);
mk('explain', 'Explique simplement en français : ', (p, r) => [['Sujet', p], ['Explication', r]]);
mk('summarize', 'Résume en français ce texte : ', (p, r) => [['Texte', p.slice(0, 200)], ['Résumé', r]]);
mk('paraphrase', 'Reformule en français ce texte : ', (p, r) => [['Original', p], ['Reformulé', r]]);
mk('correct', 'Corrige l\'orthographe et la grammaire, renvoie seulement le texte corrigé : ', (p, r) => [['Original', p], ['Corrigé', r]]);
mk('essay', 'Rédige un court essai en français sur : ', (p, r) => [['Sujet', p], ['Essai', r]]);
mk('poem', 'Écris un court poème original en français sur : ', (p, r) => [['Sujet', p], ['Poème', r]]);
mk('story', 'Écris une courte histoire originale en français sur : ', (p, r) => [['Sujet', p], ['Histoire', r]]);
const imgGen = (name) => def(name, async (c) => { const p = c.args.join(' '); if (!p) return needArgs(c, name + ' description'); let st = KO; try { await c.sock.sendMessage(c.jid, { image: { url: 'https://image.pollinations.ai/prompt/' + encodeURIComponent(p) + '?width=768&height=768&nologo=true' }, caption: p }, { quoted: c.msg }); st = OK; } catch (e) {} return [['Prompt', p], ['Statut', st]]; });
['dalle', 'midjourney', 'imagine'].forEach(imgGen);
def('bible', async (c) => { const ref = c.args.join(' '); try { const r = await J('https://bible-api.com/' + (ref ? encodeURIComponent(ref) + '?translation=almeida' : 'john 3:16')); return [['Verset', r.reference], ['Texte', r.text.trim()]]; } catch (e) { return [['Verset', ref || '—'], ['Texte', 'Introuvable']]; } });

// --- TOOLS ---
def('afk', async (c) => { c.db.afk[num(c.sender)] = { reason: c.args.join(' ') || 'Non précisée', since: Date.now() }; c.save(); return [['Raison', c.db.afk[num(c.sender)].reason], ['Statut', 'AFK activé']]; });
def('back', async (c) => { const a = c.db.afk[num(c.sender)]; delete c.db.afk[num(c.sender)]; c.save(); return [['Statut', 'AFK désactivé'], ['Durée', a ? fmtUp((Date.now() - a.since) / 1000) : '0s']]; });
const parseDur = (s) => { const m = /^(\d+)(s|m|h)?$/i.exec(s || ''); return m ? +m[1] * ({ s: 1, m: 60, h: 3600 }[(m[2] || 'm').toLowerCase()]) : 0; };
def('remind', async (c) => { const sec = parseDur(c.args[0]); const txt = c.args.slice(1).join(' '); if (!sec || !txt) return needArgs(c, 'remind 10m texte'); setTimeout(() => c.sock.sendMessage(c.jid, { text: `⏰ *RAPPEL*\n▸ ${txt}\n\n${SIG}`, mentions: [c.sender] }).catch(() => {}), sec * 1000); return [['Temps', c.args[0]], ['Rappel', txt], ['Statut', 'Programmé']]; });
def('timer', async (c) => { const sec = parseDur(c.args[0]); if (!sec) return needArgs(c, 'timer 5m'); setTimeout(() => c.sock.sendMessage(c.jid, { text: `⏲️ *TIMER*\n▸ Terminé : ${c.args[0]}\n\n${SIG}`, mentions: [c.sender] }).catch(() => {}), sec * 1000); return [['Durée', c.args[0]], ['Statut', 'En cours']]; });
def('calc', async (c) => { const e = c.args.join(' ').replace(/,/g, '.').replace(/x/gi, '*').replace(/÷/g, '/'); if (!e) return needArgs(c, 'calc 2+2*3'); if (!/^[\d\s+\-*/().%^]+$/.test(e)) return [['Expression', e], ['Résultat', 'Expression invalide']]; let r; try { r = Function('"use strict";return (' + e.replace(/\^/g, '**') + ')')(); } catch (er) { r = 'Expression invalide'; } return [['Expression', e], ['Résultat', r]]; });
def('qr', async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'qr texte'); await c.sock.sendMessage(c.jid, { image: { url: 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=' + encodeURIComponent(t) } }, { quoted: c.msg }); return [['Texte', t], ['Statut', OK]]; });
def('short', async (c) => { const u = c.args[0]; if (!/^https?:\/\//i.test(u || '')) return needArgs(c, 'short https://lien'); let s = 'Indisponible'; try { s = String(await J('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(u), { responseType: 'text' })); } catch (e) {} return [['URL', u], ['Raccourci', s]]; });
def('password', async (c) => { const n = Math.min(64, Math.max(6, +c.args[0] || 14)); const ch = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?'; let p = ''; for (let i = 0; i < n; i++) p += ch[crypto.randomInt(ch.length)]; return [['Longueur', n], ['Mot de passe', p]]; });
def('base64', async (c) => { const mode = (c.args[0] || '').toLowerCase(); const t = c.args.slice(1).join(' '); if (!['enc', 'dec'].includes(mode) || !t) return needArgs(c, 'base64 enc|dec texte'); if (mode === 'enc') return [['Encodé', Buffer.from(t).toString('base64')], ['Décodé', t]]; return [['Encodé', t], ['Décodé', Buffer.from(t, 'base64').toString('utf8')]]; });
const KEY = crypto.createHash('sha256').update(process.env.CRYPT_KEY || 'kira-tech-bot').digest();
def('encrypt', async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'encrypt texte'); const iv = crypto.randomBytes(16); const ci = crypto.createCipheriv('aes-256-cbc', KEY, iv); return [['Texte', t], ['Chiffré', iv.toString('hex') + ':' + Buffer.concat([ci.update(t), ci.final()]).toString('hex')]]; });
def('decrypt', async (c) => { const t = c.args.join(' '); if (!t) return needArgs(c, 'decrypt texte'); let r = 'Texte invalide'; try { const [iv, d] = t.split(':'); const de = crypto.createDecipheriv('aes-256-cbc', KEY, Buffer.from(iv, 'hex')); r = Buffer.concat([de.update(Buffer.from(d, 'hex')), de.final()]).toString(); } catch (e) {} return [['Texte', t.slice(0, 60)], ['Déchiffré', r]]; });
def('hash', async (c) => { const a = (c.args[0] || '').toLowerCase(); const algo = ['md5', 'sha1', 'sha256', 'sha512'].includes(a) ? a : 'sha256'; const t = (algo === a ? c.args.slice(1) : c.args).join(' '); if (!t) return needArgs(c, 'hash sha256 texte'); return [['Texte', t], ['Algorithme', algo], ['Hash', crypto.createHash(algo).update(t).digest('hex')]]; });
def('uuid', async () => [['Généré', crypto.randomUUID()]]);
def('color', async (c) => { let hex = (c.args[0] || '').replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(hex)) hex = crypto.randomBytes(3).toString('hex'); const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4), 16); const rows = [['Code', '#' + hex.toUpperCase()], ['Hex', '#' + hex.toUpperCase()], ['RGB', `${r}, ${g}, ${b}`]]; if (sharp) { try { await c.sock.sendMessage(c.jid, { image: await sharp({ create: { width: 300, height: 300, channels: 3, background: { r, g, b } } }).png().toBuffer() }, { quoted: c.msg }); } catch (e) {} } return rows; });
def('ip', async (c) => { const t = c.args[0]; if (!t) return needArgs(c, 'ip 8.8.8.8'); try { const r = await J('http://ip-api.com/json/' + encodeURIComponent(t) + '?lang=fr'); return [['Cible', t], ['IP', r.query || t], ['Localisation', r.status === 'success' ? `${r.city}, ${r.country}` : 'Introuvable']]; } catch (e) { return [['Cible', t], ['IP', '—'], ['Localisation', 'Indisponible']]; } });
def('whois', async (c) => { const d = (c.args[0] || '').replace(/^https?:\/\//, '').split('/')[0]; if (!d) return needArgs(c, 'whois domaine.com'); try { const r = await J('https://rdap.org/domain/' + d); const ev = (n) => ((r.events || []).find((e) => e.action === n) || {}).eventDate; const reg = ((r.entities || []).find((e) => (e.roles || []).includes('registrar')) || {}).vcardArray; return [['Domaine', d], ['Registrar', (reg && reg[1].find((x) => x[0] === 'fn')[3]) || '—'], ['Expiration', (ev('expiration') || '—').slice(0, 10)]]; } catch (e) { return [['Domaine', d], ['Registrar', '—'], ['Expiration', '—']]; } });
def('dns', async (c) => { const d = (c.args[0] || '').replace(/^https?:\/\//, '').split('/')[0]; if (!d) return needArgs(c, 'dns domaine.com'); const a = await dns.resolve4(d).catch(() => []); const mx = await dns.resolveMx(d).catch(() => []); return [['Domaine', d], ['A', a.join(', ') || '—'], ['MX', mx.map((m) => m.exchange).join(', ') || '—']]; });
def('ping2', async (c) => { const u = c.args[0]; if (!u) return needArgs(c, 'ping2 https://site.com'); const t = Date.now(); let l = '—'; try { await axios.head(/^https?:/.test(u) ? u : 'https://' + u, { timeout: 10000 }); l = Date.now() - t; } catch (e) { try { await axios.get(/^https?:/.test(u) ? u : 'https://' + u, { timeout: 10000 }); l = Date.now() - t; } catch (e2) {} } return [['Cible', u], ['Latence', l + ' ms']]; });
def('currency', async (c) => { const amount = parseFloat((c.args[0] || '').replace(',', '.')); const from = (c.args[1] || '').toUpperCase(), to = (c.args[2] || '').toUpperCase(); if (!amount || !from || !to) return needArgs(c, 'currency 10 USD XOF'); try { const r = await J('https://open.er-api.com/v6/latest/' + from); const v = r.rates[to]; return [['Montant', amount], ['De', `${from} → ${to}`], ['Résultat', v ? (amount * v).toFixed(2) + ' ' + to : 'Devise inconnue']]; } catch (e) { return [['Montant', amount], ['De', `${from} → ${to}`], ['Résultat', 'Indisponible']]; } });
const U = { km: 1000, m: 1, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, kg: 1, g: 0.001, lb: 0.45359237, oz: 0.0283495 };
def('unit', async (c) => { const v = parseFloat(c.args[0]); const f = (c.args[1] || '').toLowerCase(), t = (c.args[2] || '').toLowerCase(); if (isNaN(v) || !f || !t) return needArgs(c, 'unit 10 km mi'); let r; if (['c', 'f', 'k'].includes(f) && ['c', 'f', 'k'].includes(t)) { const cel = f === 'c' ? v : f === 'f' ? (v - 32) * 5 / 9 : v - 273.15; r = t === 'c' ? cel : t === 'f' ? cel * 9 / 5 + 32 : cel + 273.15; } else if (U[f] && U[t]) r = v * U[f] / U[t]; else return [['Valeur', v], ['De', `${f} → ${t}`], ['Résultat', 'Unité inconnue']]; return [['Valeur', v], ['De', `${f} → ${t}`], ['Résultat', +r.toFixed(4)]]; });

// ---------- Dispatcher ----------
async function handle(sock, msg, ctx) {
  const m0 = msg.message; const jid = msg.key.remoteJid;
  if (!m0 || !jid || jid === 'status@broadcast' || jid.endsWith('@newsletter')) return;
  const m = unwrap(m0);
  const text = getText(m); const prefix = ctx.db.prefix || ctx.config.prefix || '.';
  if (!text.startsWith(prefix)) return;
  const parts = text.slice(prefix.length).trim().split(/\s+/);
  const cmd = (parts.shift() || '').toLowerCase();
  if (!H[cmd]) return;

  const isGroup = jid.endsWith('@g.us');
  const senderJid = msg.key.fromMe ? B.jidNormalizedUser(sock.user.id) : (msg.key.participant || jid);
  const senderNum = num(senderJid);
  const isOwner = msg.key.fromMe || senderNum === ctx.config.owner || senderNum === num(sock.user.id);
  if (ctx.db.blacklist.includes(senderNum) && !isOwner) return;

  const ci = m.extendedTextMessage && m.extendedTextMessage.contextInfo;
  const mentioned = (ci && ci.mentionedJid) || [];
  const quotedRaw = ci && ci.quotedMessage;
  const quotedKey = quotedRaw ? { remoteJid: jid, id: ci.stanzaId, participant: ci.participant } : null;
  let target = mentioned[0] || (ci && ci.participant) || null;
  if (!target) { const n = (parts.find((a) => /^\+?\d{8,15}$/.test(a)) || '').replace('+', ''); if (n) target = n + '@s.whatsapp.net'; }

  let meta = null, isAdmin = false;
  if (isGroup) {
    meta = await sock.groupMetadata(jid).catch(() => null);
    if (meta) { const p = meta.participants.find((x) => num(x.id) === senderNum); isAdmin = !!(p && p.admin); }
  }
  ctx.db.groups[jid] = ctx.db.groups[jid] || {};
  const us = (ctx.db.userStats[senderNum] = ctx.db.userStats[senderNum] || { cmds: 0, first: Date.now() });
  us.cmds++; ctx.db.stats.commands++;

  const q = quotedRaw ? unwrap(quotedRaw) : null;
  const c = {
    sock, msg, jid, ctx, db: ctx.db, cfg: ctx.config, prefix, cmd, args: parts, isGroup, meta, isAdmin, isOwner,
    sender: senderJid, pushName: msg.pushName || senderNum, target, mentioned, mentions: [], group: ctx.db.groups[jid],
    quotedRaw, quotedKey, quotedText: q ? getText(q) : '', save: ctx.save,
    send: (t, extra) => sock.sendMessage(jid, Object.assign({ text: t }, extra || {}), { quoted: msg }),
    mediaBuf: async (kind) => {
      const tryMsg = async (mm, key) => {
        if (!mm) return null; const mm2 = unwrap(mm);
        const types = { image: 'imageMessage', video: 'videoMessage', audio: 'audioMessage', sticker: 'stickerMessage' };
        const t = kind === 'any' ? Object.values(types).concat(['documentMessage']).find((x) => mm2[x]) : (mm2[types[kind]] ? types[kind] : null);
        if (!t) return null;
        c.mediaExt = (mm2[t].mimetype || '').split('/')[1] ? mm2[t].mimetype.split('/')[1].split(';')[0] : 'bin';
        return B.downloadMediaMessage({ key, message: mm2 }, 'buffer', {});
      };
      try { return (await tryMsg(quotedRaw, quotedKey)) || (await tryMsg(m, msg.key)); } catch (e) { return null; }
    }
  };
  c.group = ctx.db.groups[jid];

  try { sock.sendMessage(jid, { react: { text: EMO[cmd], key: msg.key } }).catch(() => {}); } catch (e) {}
  let out;
  try { out = await H[cmd](c); }
  catch (e) { console.error('[cmd ' + cmd + ']', e.message); out = [['Statut', 'Service momentanément indisponible, réessaie']]; }
  if (out === null) return;
  const res = Array.isArray(out) ? { rows: out } : out;
  const body = res.text || fmt(cmd, res.rows || []);
  const img = res.img || IMG[cmd];
  const opts = { quoted: msg };
  const mentionList = (c.mentions || []).concat(mentioned, c.target ? [c.target] : [], [senderJid]);
  try {
    if (img && body.length > 1000) {
      // légende WhatsApp limitée : image + en-tête, puis le reste du texte
      let cut = body.lastIndexOf('\n\n', 1000); if (cut < 100) cut = body.indexOf('\n\n');
      await sock.sendMessage(jid, { image: { url: img }, caption: body.slice(0, cut), mentions: mentionList }, opts);
      await sock.sendMessage(jid, { text: body.slice(cut).trim(), mentions: mentionList });
    } else if (img) await sock.sendMessage(jid, { image: { url: img }, caption: body, mentions: mentionList }, opts);
    else await sock.sendMessage(jid, { text: body, mentions: mentionList }, opts);
  } catch (e) {
    try { await sock.sendMessage(jid, { text: body, mentions: mentionList }, opts); } catch (e2) { console.error('[send]', e2.message); }
  }
  evenement.onCommand(sock, jid, ctx).catch(() => {});
}

module.exports = { handle, TOTAL, menuText, H };
