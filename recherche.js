'use strict';
/**
 * Recherche.js — configuration partagée + base de données quizz/devinettes
 * + récupération de contenu otaku (actus RSS, images, memes, stickers).
 */
const axios = require('axios');
const Parser = require('rss-parser');
const storage = require('./stockage');

/* =====================================================================
   CONFIGURATION PARTAGÉE (liens, images, textes de marque)
   ===================================================================== */
const CONFIG = {
  BOT_NAME: '★ 𝙾𝚃𝙰𝙺𝚄 𝙰𝙽𝙸𝙼𝙴 𝙱𝙾𝚃 ★',
  BOT_LINK: process.env.BOT_LINK || 'https://t.me/Kira_otaku_bot',
  SUPPORT_LINK: process.env.SUPPORT_LINK || 'https://t.me/KIRA_SUPPORT_HUB',
  PREFIX: '.',
  LINKS: {
    tgChannel: 'https://t.me/+mQ3aQpCsEqI0YmY0',
    tgGroup1: 'https://t.me/+2JDC_Be4_ww1N2Vk',
    tgGroup2: 'https://t.me/+Z-P_xjUgJjU0MjM0',
    waChannel: 'https://whatsapp.com/channel/0029Vb7WJzp84OmBD0fEEJ2X',
    waGroup: 'https://chat.whatsapp.com/IP0nFB79rMDF0nvFSMXtDR',
  },
  IMAGES: {
    // Telegram
    start: 'https://i.ibb.co/4qDQ0xh/F9-D03894-A7-BF-43-E2-AF3-E-E3104-AF7495-F.jpg',
    help: 'https://i.ibb.co/v4YPxDFz/ED79169-F-4-EEF-48-E1-AE1-D-41-CF2-BA1609-C.jpg',
    contact: 'https://i.ibb.co/Pv3zFvPC/AD7-F4-C7-B-C5-F8-4-F01-A696-422-BD17011-FA.jpg',
    users: 'https://i.ibb.co/8nZ3LY0y/DE712903-A296-46-E9-949-F-2-CF8-A95398-AC.jpg',
    pair: 'https://i.ibb.co/Vcrt6Qv5/AD0-D933-F-71-C6-4631-93-A5-51-F30-E20296-D.jpg',
    connect: 'https://i.ibb.co/j1MzHQJ/7-B34-E307-35-D4-4331-89-DE-CCE2-D67-E44-BB.jpg',
    // WhatsApp
    waConnect: 'https://i.ibb.co/xqZMd5cg/213-CD2-B1-5-BAE-4-A52-8537-CA19-B7-F93557.jpg',
    menu: 'https://i.ibb.co/fY77zh3x/BAADC610-B7-D5-47-C5-9-B3-F-2-CDF93-A974-E2.jpg',
    waHelp: 'https://i.ibb.co/7tKZhzsZ/2-E77-FAC9-5-C0-E-47-BE-B9-B5-8-C0-E8884070-E.jpg',
    ping: 'https://i.ibb.co/jPNKCy4N/3-F46-A49-D-EC8-A-4002-B57-E-2626411-FFB46.jpg',
    on: 'https://i.ibb.co/N6MtDXpS/C1-EED6-EF-DDA6-4-B61-B7-FC-1-B4-FEFEF6704.jpg',
    off: 'https://i.ibb.co/jvWvwWhV/8556-B148-864-B-45-DC-B3-FE-ECFBE40957-B2.jpg',
    // Pas encore d'image fournie : mets l'URL ici ou dans la variable d'environnement
    jeux: process.env.IMG_JEUX || null,
  },
};

/* =====================================================================
   OUTILS
   ===================================================================== */
const http = axios.create({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OtakuAnimeBot/1.0)' },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function nowStamp(date = new Date()) {
  const tz = process.env.BOT_TZ || 'Africa/Brazzaville';
  let parts;
  try {
    parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(date);
  } catch (e) {
    parts = [];
  }
  const g = (t) => (parts.find((p) => p.type === t) || {}).value || '00';
  return `${g('hour')}:${g('minute')} / ${g('day')} / ${g('month')} / ${g('year')}`;
}

function dateOnly(date = new Date()) {
  const s = nowStamp(date).split(' / ');
  return `${s[1]}/${s[2]}/${s[3]}`;
}

/* =====================================================================
   BASE DE DONNÉES PERSONNAGES  [affichage, nom de recherche, anime, pouvoir, niveau]
   niveau : f = facile, i = intermédiaire, d = difficile
   ===================================================================== */
const CHARS = [
  // 🟢 Facile
  ['Naruto Uzumaki', 'Naruto Uzumaki', 'Naruto', 'Rasengan', 'f'],
  ['Sasuke Uchiha', 'Sasuke Uchiha', 'Naruto', 'Chidori', 'f'],
  ['Kakashi Hatake', 'Kakashi Hatake', 'Naruto', 'Raikiri', 'f'],
  ['Monkey D. Luffy', 'Monkey D. Luffy', 'One Piece', 'Corps en caoutchouc', 'f'],
  ['Roronoa Zoro', 'Roronoa Zoro', 'One Piece', 'Style à trois sabres (Santoryu)', 'f'],
  ['Sanji', 'Sanji', 'One Piece', 'Combat aux jambes (Diable Jambe)', 'f'],
  ['Nami', 'Nami', 'One Piece', 'Clima-Tact (contrôle de la météo)', 'f'],
  ['Goku', 'Son Goku', 'Dragon Ball', 'Kamehameha', 'f'],
  ['Vegeta', 'Vegeta', 'Dragon Ball', 'Final Flash', 'f'],
  ['Piccolo', 'Piccolo', 'Dragon Ball', 'Makankosappo', 'f'],
  ['Freezer', 'Frieza', 'Dragon Ball', 'Death Ball', 'f'],
  ['Pikachu', 'Pikachu', 'Pokémon', 'Éclair', 'f'],
  ['Ash Ketchum', 'Ash Ketchum', 'Pokémon', 'Dresseur Pokémon', 'f'],
  // 🟡 Intermédiaire
  ['Itachi Uchiha', 'Itachi Uchiha', 'Naruto', 'Tsukuyomi', 'i'],
  ['Tanjiro Kamado', 'Tanjiro Kamado', 'Demon Slayer', 'Respiration de l’eau et Danse du Dieu du feu', 'i'],
  ['Zenitsu Agatsuma', 'Zenitsu Agatsuma', 'Demon Slayer', 'Respiration de la foudre', 'i'],
  ['Inosuke Hashibira', 'Inosuke Hashibira', 'Demon Slayer', 'Respiration de la bête', 'i'],
  ['Nezuko Kamado', 'Nezuko Kamado', 'Demon Slayer', 'Art démoniaque du sang', 'i'],
  ['Satoru Gojo', 'Satoru Gojo', 'Jujutsu Kaisen', 'L’Infini et les Six Yeux', 'i'],
  ['Yuji Itadori', 'Yuji Itadori', 'Jujutsu Kaisen', 'Black Flash (Éclair noir)', 'i'],
  ['Megumi Fushiguro', 'Megumi Fushiguro', 'Jujutsu Kaisen', 'Technique des Dix Ombres', 'i'],
  ['Ryomen Sukuna', 'Ryomen Sukuna', 'Jujutsu Kaisen', 'Démantèlement (Dismantle)', 'i'],
  ['Izuku Midoriya', 'Izuku Midoriya', 'My Hero Academia', 'One For All', 'i'],
  ['Katsuki Bakugo', 'Katsuki Bakugou', 'My Hero Academia', 'Explosion', 'i'],
  ['Shoto Todoroki', 'Shouto Todoroki', 'My Hero Academia', 'Glace et feu', 'i'],
  ['Eren Jaeger', 'Eren Yeager', 'Attack on Titan', 'Titan Assaillant', 'i'],
  ['Levi Ackerman', 'Levi Ackerman', 'Attack on Titan', 'Maniement du matériel tridimensionnel (ODM)', 'i'],
  ['Mikasa Ackerman', 'Mikasa Ackerman', 'Attack on Titan', 'Force des Ackerman', 'i'],
  ['Armin Arlert', 'Armin Arlert', 'Attack on Titan', 'Titan Colossal', 'i'],
  ['Saitama', 'Saitama', 'One Punch Man', 'Un seul coup de poing', 'i'],
  ['Natsu Dragneel', 'Natsu Dragneel', 'Fairy Tail', 'Dragon Slayer du feu', 'i'],
  ['Asta', 'Asta', 'Black Clover', 'Anti-magie', 'i'],
  ['Denji', 'Denji', 'Chainsaw Man', 'Fusion avec Pochita (Chainsaw)', 'i'],
  ['Light Yagami', 'Light Yagami', 'Death Note', 'Le Death Note', 'i'],
  ['Edward Elric', 'Edward Elric', 'Fullmetal Alchemist', 'Alchimie sans cercle de transmutation', 'i'],
  // 🔴 Difficile
  ['Guts', 'Guts', 'Berserk', 'Épée Dragonslayer (Tueur de dragons)', 'd'],
  ['Shinji Ikari', 'Shinji Ikari', 'Evangelion', 'Pilote de l’EVA-01', 'd'],
  ['Kenzo Tenma', 'Kenzou Tenma', 'Monster', 'Chirurgien de génie', 'd'],
  ['Gon Freecss', 'Gon Freecss', 'Hunter x Hunter', 'Jajanken', 'd'],
  ['Killua Zoldyck', 'Killua Zoldyck', 'Hunter x Hunter', 'Godspeed (Nen de foudre)', 'd'],
  ['Kurapika', 'Kurapika', 'Hunter x Hunter', 'Chaînes du Nen', 'd'],
  ['Hisoka Morow', 'Hisoka Morow', 'Hunter x Hunter', 'Bungee Gum', 'd'],
  ['Ichigo Kurosaki', 'Ichigo Kurosaki', 'Bleach', 'Bankai Tensa Zangetsu', 'd'],
  ['Byakuya Kuchiki', 'Byakuya Kuchiki', 'Bleach', 'Senbonzakura', 'd'],
  ['Lelouch Lamperouge', 'Lelouch Lamperouge', 'Code Geass', 'Geass (obéissance absolue)', 'd'],
  ['L', 'L Lawliet', 'Death Note', 'Détective de génie', 'd'],
  ['Spike Spiegel', 'Spike Spiegel', 'Cowboy Bebop', 'Jeet Kune Do et tir de précision', 'd'],
  ['Rimuru Tempest', 'Rimuru Tempest', 'Moi, quand je me réincarne en Slime', 'Prédateur', 'd'],
  ['Sung Jinwoo', 'Sung Jin-Woo', 'Solo Leveling', 'Armée d’ombres', 'd'],
  ['Anya Forger', 'Anya Forger', 'Spy x Family', 'Télépathie', 'd'],
  ['Senku Ishigami', 'Senkuu Ishigami', 'Dr. Stone', 'Génie scientifique', 'd'],
  ['Kenshin Himura', 'Kenshin Himura', 'Kenshin le vagabond', 'Hiten Mitsurugi-ryu', 'd'],
  ['Yusuke Urameshi', 'Yuusuke Urameshi', 'Yu Yu Hakusho', 'Rei Gun (Spirit Gun)', 'd'],
  ['Meliodas', 'Meliodas', 'Seven Deadly Sins', 'Full Counter', 'd'],
  ['Frieren', 'Frieren', 'Frieren', 'Magie d’elfe millénaire', 'd'],
  ['Mob', 'Shigeo Kageyama', 'Mob Psycho 100', 'Pouvoirs psychiques', 'd'],
].map(([n, s, a, p, l]) => ({ n, s, a, p, l }));

/* Faits culturels : [question, bonne réponse, [3 mauvaises réponses], niveau] */
const FACTS = [
  // 🟢 Facile
  ['Qui est le créateur de One Piece ?', 'Eiichiro Oda', ['Masashi Kishimoto', 'Akira Toriyama', 'Tite Kubo'], 'f'],
  ['Qui est le créateur de Naruto ?', 'Masashi Kishimoto', ['Eiichiro Oda', 'Akira Toriyama', 'Hajime Isayama'], 'f'],
  ['Qui est le créateur de Dragon Ball ?', 'Akira Toriyama', ['Masashi Kishimoto', 'Eiichiro Oda', 'Tite Kubo'], 'f'],
  ['Quel est le rêve de Luffy ?', 'Devenir le Roi des pirates', ['Devenir Hokage', 'Trouver les Dragon Balls', 'Devenir le meilleur dresseur'], 'f'],
  ['Quel est le rêve de Naruto ?', 'Devenir Hokage', ['Devenir Roi des pirates', 'Devenir Shinigami', 'Devenir Hunter'], 'f'],
  ['Combien de Dragon Balls faut-il réunir pour invoquer Shenron ?', '7', ['5', '9', '12'], 'f'],
  ['De quel type est Pikachu ?', 'Électrique', ['Feu', 'Eau', 'Plante'], 'f'],
  ['Comment s’appelle le village de Naruto ?', 'Konoha', ['Suna', 'Kiri', 'Iwa'], 'f'],
  ['Quel fruit du démon Luffy a-t-il mangé ?', 'Gum-Gum (Gomu Gomu no Mi)', ['Mera Mera no Mi', 'Hito Hito no Mi', 'Yami Yami no Mi'], 'f'],
  ['Comment s’appelle le renard à neuf queues scellé en Naruto ?', 'Kurama', ['Shukaku', 'Matatabi', 'Isobu'], 'f'],
  ['Quel est le nom de naissance de Goku chez les Saiyans ?', 'Kakarot', ['Radditz', 'Bardock', 'Nappa'], 'f'],
  ['Comment s’appelle l’équipage de Luffy ?', 'Équipage du Chapeau de paille', ['Équipage de Barbe Blanche', 'Équipage du Roux', 'Équipage de Barbe Noire'], 'f'],
  // 🟡 Intermédiaire
  ['Qui est la créatrice (le créateur) de Demon Slayer ?', 'Koyoharu Gotouge', ['Gege Akutami', 'Kohei Horikoshi', 'Hajime Isayama'], 'i'],
  ['Qui est le créateur de Jujutsu Kaisen ?', 'Gege Akutami', ['Koyoharu Gotouge', 'Tite Kubo', 'Yoshihiro Togashi'], 'i'],
  ['Qui est le créateur de My Hero Academia ?', 'Kohei Horikoshi', ['Gege Akutami', 'Masashi Kishimoto', 'Hiromu Arakawa'], 'i'],
  ['Qui est le créateur de L’Attaque des Titans ?', 'Hajime Isayama', ['Kohei Horikoshi', 'Eiichiro Oda', 'Tsugumi Ohba'], 'i'],
  ['Combien de Piliers (Hashira) y a-t-il dans Demon Slayer ?', '9', ['6', '7', '12'], 'i'],
  ['Comment s’appelle le démon suprême de Demon Slayer ?', 'Muzan Kibutsuji', ['Kokushibo', 'Akaza', 'Doma'], 'i'],
  ['Dans Jujutsu Kaisen, comment s’appelle le Roi des Fléaux ?', 'Ryomen Sukuna', ['Mahito', 'Jogo', 'Toji Fushiguro'], 'i'],
  ['Qui est le héros numéro 1 au début de My Hero Academia ?', 'All Might', ['Endeavor', 'Hawks', 'Eraser Head'], 'i'],
  ['Combien de murs protègent l’humanité dans L’Attaque des Titans ?', '3', ['2', '4', '5'], 'i'],
  ['Comment s’appelle le dieu de la mort de Death Note ?', 'Ryuk', ['Rem', 'Shinigami Gelus', 'Sidoh'], 'i'],
  ['Dans Hunter x Hunter, comment s’appelle l’énergie vitale ?', 'Nen', ['Chakra', 'Ki', 'Reiatsu'], 'i'],
  ['Dans Bleach, comment s’appellent les dieux de la mort ?', 'Shinigami', ['Hollows', 'Quincy', 'Arrancar'], 'i'],
  // 🔴 Difficile
  ['Qui est le créateur de Berserk ?', 'Kentaro Miura', ['Naoki Urasawa', 'Yoshihiro Togashi', 'Hideaki Anno'], 'd'],
  ['Qui est le créateur de Neon Genesis Evangelion ?', 'Hideaki Anno', ['Kentaro Miura', 'Naoki Urasawa', 'Shinichiro Watanabe'], 'd'],
  ['Qui est le créateur de Hunter x Hunter ?', 'Yoshihiro Togashi', ['Tite Kubo', 'Hiromu Arakawa', 'Kentaro Miura'], 'd'],
  ['Qui est le créateur de Monster ?', 'Naoki Urasawa', ['Kentaro Miura', 'Takehiko Inoue', 'Hideaki Anno'], 'd'],
  ['Qui est le créateur de Bleach ?', 'Tite Kubo', ['Yoshihiro Togashi', 'Eiichiro Oda', 'Masashi Kishimoto'], 'd'],
  ['Comment s’appellent les ennemis de l’humanité dans Evangelion ?', 'Les Anges', ['Les Titans', 'Les Hollows', 'Les Démons'], 'd'],
  ['Qui est le chef de la Bande du Faucon dans Berserk ?', 'Griffith', ['Guts', 'Casca', 'Zodd'], 'd'],
  ['Dans Code Geass, quel empire a envahi le Japon ?', 'Le Saint Empire de Britannia', ['L’Empire du Milieu', 'La Fédération de Chine', 'L’Union d’Amestris'], 'd'],
  ['Dans Hunter x Hunter, comment s’appelle la bande criminelle que traque Kurapika ?', 'La Brigade fantôme (Genei Ryodan)', ['Les Zoldyck', 'Les Dix Seigneurs', 'La Fraternité Chimera'], 'd'],
  ['Comment s’appelle l’épée d’Ichigo dans Bleach ?', 'Zangetsu', ['Senbonzakura', 'Hyorinmaru', 'Zabimaru'], 'd'],
  ['Quel est le vrai nom de L dans Death Note ?', 'L Lawliet', ['Near Rivers', 'Mello Keehl', 'Light Yagami'], 'd'],
  ['Dans One Piece, qui est le Roi des pirates exécuté à Logue Town ?', 'Gol D. Roger', ['Edward Newgate', 'Shanks', 'Kozuki Oden'], 'd'],
];

/* Devinettes à indices : [indice, réponse, [3 mauvaises réponses], niveau] */
const RIDDLES = [
  ['Je rêve de devenir le Roi des pirates et mon corps est en caoutchouc. Qui suis-je ?', 'Monkey D. Luffy', ['Roronoa Zoro', 'Sanji', 'Usopp'], 'f'],
  ['Je suis un ninja de Konoha, je rêve de devenir Hokage et un renard est scellé en moi. Qui suis-je ?', 'Naruto Uzumaki', ['Sasuke Uchiha', 'Kakashi Hatake', 'Rock Lee'], 'f'],
  ['Je suis un Saiyan élevé sur Terre et mon attaque signature est le Kamehameha. Qui suis-je ?', 'Goku', ['Vegeta', 'Piccolo', 'Gohan'], 'f'],
  ['J’écris des noms dans un cahier pour faire mourir les gens. Qui suis-je ?', 'Light Yagami', ['L', 'Ryuk', 'Near'], 'i'],
  ['Je suis le sorcier le plus fort de Jujutsu Kaisen et mes yeux sont bleus (Six Yeux). Qui suis-je ?', 'Satoru Gojo', ['Yuji Itadori', 'Megumi Fushiguro', 'Kento Nanami'], 'i'],
  ['Je bats mes ennemis d’un seul coup de poing et je suis chauve. Qui suis-je ?', 'Saitama', ['Genos', 'All Might', 'Mob'], 'i'],
  ['Ma famille a été tuée par un démon et ma petite sœur Nezuko est devenue un démon. Qui suis-je ?', 'Tanjiro Kamado', ['Zenitsu Agatsuma', 'Inosuke Hashibira', 'Giyu Tomioka'], 'i'],
  ['J’ai massacré mon clan pour protéger mon village et mon petit frère veut ma peau. Qui suis-je ?', 'Itachi Uchiha', ['Sasuke Uchiha', 'Madara Uchiha', 'Obito Uchiha'], 'i'],
  ['Je suis un jeune alchimiste avec un bras en automail à la recherche de la pierre philosophale. Qui suis-je ?', 'Edward Elric', ['Roy Mustang', 'Alphonse Elric', 'Scar'], 'i'],
  ['Je pilote l’EVA-01 et je n’aime pas qu’on me demande de monter dedans. Qui suis-je ?', 'Shinji Ikari', ['Kaworu Nagisa', 'Rei Ayanami', 'Asuka Langley'], 'd'],
  ['Je suis un chasseur de primes à bord du Bebop. « See you space cowboy… ». Qui suis-je ?', 'Spike Spiegel', ['Jet Black', 'Vicious', 'Edward Wong'], 'd'],
  ['Je suis un Hunter qui utilise le Jajanken, mon meilleur ami s’appelle Killua. Qui suis-je ?', 'Gon Freecss', ['Kurapika', 'Leorio Paradinight', 'Hisoka Morow'], 'd'],
  ['Je suis un mercenaire à la grande épée, marqué par l’Éclipse. Qui suis-je ?', 'Guts', ['Griffith', 'Casca', 'Zodd'], 'd'],
  ['Je suis un lycéen britannien-japonais doté du Geass et je veux détruire l’Empire. Qui suis-je ?', 'Lelouch Lamperouge', ['Suzaku Kururugi', 'C.C.', 'Schneizel'], 'd'],
];

const TITLES = [
  ['Attack on ___', 'Titan'], ['Demon ___', 'Slayer'], ['Jujutsu ___', 'Kaisen'], ['One ___', 'Piece'],
  ['My Hero ___', 'Academia'], ['Fullmetal ___', 'Alchemist'], ['Death ___', 'Note'], ['Dragon ___', 'Ball'],
  ['Hunter x ___', 'Hunter'], ['Black ___', 'Clover'], ['Fairy ___', 'Tail'], ['Chainsaw ___', 'Man'],
  ['Solo ___', 'Leveling'], ['Cowboy ___', 'Bebop'], ['Code ___', 'Geass'], ['Seven Deadly ___', 'Sins'],
];

const EMOJIS = ['✨', '🔥', '⚡', '🌀', '🗡️', '🍥', '🏴‍☠️', '🩸', '♾️', '🪄', '💥', '🎌', '🌸', '🧿', '🐉', '👁️', '🛡️', '🌙', '⭐', '💫'];

const LEVELS = {
  f: { label: 'Facile', icon: '🟢' },
  i: { label: 'Intermédiaire', icon: '🟡' },
  d: { label: 'Difficile', icon: '🔴' },
};

/* =====================================================================
   QUIZZ
   ===================================================================== */
function makeQuestion(q, correct, pool, level, extra = {}) {
  const wrongs = sample([...new Set(pool.filter((x) => x !== correct))], 3);
  const choices = shuffle([correct, ...wrongs]);
  return Object.assign({ q, choices, emojis: sample(EMOJIS, choices.length), answer: choices.indexOf(correct), level }, extra);
}

function buildBank() {
  const bank = [];
  const animes = [...new Set(CHARS.map((c) => c.a))];
  const powers = CHARS.map((c) => c.p);
  for (const c of CHARS) {
    bank.push({ q: `De quel anime vient ${c.n} ?`, a: c.a, pool: animes, l: c.l, t: 'anime' });
    bank.push({ q: `Quel est le pouvoir ou la spécialité de ${c.n} ?`, a: c.p, pool: powers, l: c.l, t: 'pouvoir' });
    bank.push({
      q: `Qui est un personnage de l’anime ${c.a} ?`,
      a: c.n,
      pool: CHARS.filter((o) => o.a !== c.a).map((o) => o.n),
      l: c.l,
      t: 'personnage',
    });
    bank.push({
      q: `Quel personnage est connu pour : ${c.p} ?`,
      a: c.n,
      pool: CHARS.filter((o) => o.a !== c.a).map((o) => o.n),
      l: c.l,
      t: 'qui',
    });
  }
  for (const [q, a, wrongs, l] of FACTS) bank.push({ q, a, pool: wrongs, l, t: 'fait' });
  return bank;
}

const BANK = buildBank();
const recentQ = [];

function getQuiz(level) {
  let list = level ? BANK.filter((b) => b.l === level) : BANK;
  const fresh = list.filter((b) => !recentQ.includes(b.q));
  if (fresh.length) list = fresh;
  const item = pick(list);
  recentQ.push(item.q);
  if (recentQ.length > 80) recentQ.shift();
  return makeQuestion(item.q, item.a, item.pool, item.l);
}

/* =====================================================================
   JIKAN (MyAnimeList) : images de personnages
   ===================================================================== */
let jikanChain = Promise.resolve();

function jikan(pathname, params) {
  const run = async () => {
    for (let t = 0; t < 2; t++) {
      try {
        const r = await http.get('https://api.jikan.moe/v4' + pathname, { params });
        await sleep(450);
        return r.data;
      } catch (e) {
        if (e.response && e.response.status === 429) {
          await sleep(1500);
          continue;
        }
        throw e;
      }
    }
    throw new Error('Jikan indisponible');
  };
  const p = jikanChain.then(run);
  jikanChain = p.catch(() => {});
  return p;
}

const charCache = new Map();

async function charInfo(c) {
  if (charCache.has(c.s)) return charCache.get(c.s);
  const data = await jikan('/characters', { q: c.s, limit: 3, order_by: 'favorites', sort: 'desc' });
  const list = (data && data.data) || [];
  const tokens = c.s.split(/\s+/).map(normalize).filter((t) => t.length >= 3);
  const hit = list.find((d) => {
    const name = normalize(d.name);
    return tokens.length ? tokens.some((t) => name.includes(t)) : true;
  });
  if (!hit) throw new Error('personnage introuvable : ' + c.s);
  const imgs = hit.images || {};
  const info = { id: hit.mal_id, image: (imgs.jpg && imgs.jpg.image_url) || (imgs.webp && imgs.webp.image_url) || null };
  charCache.set(c.s, info);
  return info;
}

/* =====================================================================
   DEVINETTES (image personnage → indices → pouvoir)
   ===================================================================== */
async function getDevinette(i = 0) {
  const mode = i === 0 ? 'image' : i === 1 ? 'riddle' : pick(['image', 'riddle', 'pouvoir']);

  if (mode === 'image') {
    for (let t = 0; t < 3; t++) {
      const c = pick(CHARS);
      try {
        const info = await charInfo(c);
        if (!info.image) continue;
        return makeQuestion('Qui est ce personnage ? 🫠✨', c.n, CHARS.map((x) => x.n), c.l, { image: info.image, kind: 'image' });
      } catch (e) {
        /* on essaie un autre personnage */
      }
    }
  }

  if (mode === 'pouvoir') {
    const item = pick(BANK.filter((b) => b.t === 'qui' || b.t === 'pouvoir'));
    return makeQuestion(item.q, item.a, item.pool, item.l, { kind: 'pouvoir' });
  }

  const [clue, a, wrongs, l] = pick(RIDDLES);
  return makeQuestion(clue, a, wrongs, l, { kind: 'riddle' });
}

/* =====================================================================
   JEUX (quiz rapide, devinette image, qui suis-je ?, complète le titre)
   ===================================================================== */
async function getJeu() {
  const kind = pick(['quiz', 'devinette', 'quisuisje', 'titre']);
  if (kind === 'quiz') return { title: '⚡ Quiz rapide', q: getQuiz('f') };
  if (kind === 'devinette') return { title: '🖼️ Devinette image', q: await getDevinette(0) };
  if (kind === 'quisuisje') {
    const c = pick(CHARS);
    const q = makeQuestion(`Qui suis-je ?\n🎬 Anime : ${c.a}\n💥 Pouvoir : ${c.p}`, c.n, CHARS.map((x) => x.n), c.l);
    return { title: '🕵️ Qui suis-je ?', q };
  }
  const [t, a] = pick(TITLES);
  return { title: '🧩 Complète le titre', q: makeQuestion(`Complète le titre : ${t}`, a, TITLES.map((x) => x[1]), 'f') };
}

/* =====================================================================
   SONDAGES
   ===================================================================== */
const POLLS = [
  ['Quel est le meilleur anime de 2024 ?', ['Jujutsu Kaisen 🌀', 'Solo Leveling ⚔️', 'Frieren 🧝', 'One Piece 🏴‍☠️']],
  ['Quel est ton anime préféré de tous les temps ?', ['Naruto 🍥', 'One Piece 🏴‍☠️', 'Attack on Titan ⚔️', 'Death Note 📓']],
  ['Team Naruto ou team Sasuke ?', ['Team Naruto 🍥', 'Team Sasuke ⚡', 'Team Itachi 🩸', 'Team Kakashi 📖']],
  ['Quel est le meilleur trio d’anime ?', ['Naruto, Sasuke & Sakura 🍥', 'Luffy, Zoro & Sanji 🏴‍☠️', 'Gon, Killua & Kurapika 🎣', 'Tanjiro, Zenitsu & Inosuke 🌊']],
  ['Quel pouvoir voudrais-tu avoir ?', ['L’Infini de Gojo ♾️', 'Le Gum-Gum de Luffy 🏴‍☠️', 'Le Sharingan 🩸', 'Le Kamehameha 💥']],
  ['Quel est le meilleur antagoniste ?', ['Madara Uchiha 🔥', 'Muzan Kibutsuji 🩸', 'Johan Liebert 🎭', 'Freezer 👑']],
  ['Meilleur shōnen des « Big Three » ?', ['Naruto 🍥', 'One Piece 🏴‍☠️', 'Bleach 🗡️']],
  ['Tu regardes les animes en quelle langue ?', ['VOSTFR 🇯🇵', 'VF 🇫🇷', 'VO sans sous-titres 😎', 'Je lis le manga 📖']],
  ['Quel est ton personnage préféré de One Piece ?', ['Luffy 🏴‍☠️', 'Zoro ⚔️', 'Sanji 🦵', 'Ace 🔥']],
  ['Meilleur opening d’anime ?', ['Unravel (Tokyo Ghoul) 🎶', 'Gurenge (Demon Slayer) 🔥', 'Guren no Yumiya (AoT) ⚔️', 'Kaikai Kitan (JJK) 🌀']],
  ['Quel est le meilleur combat d’anime ?', ['Naruto vs Sasuke 🍥', 'Goku vs Vegeta 💥', 'Tanjiro vs Rui 🌊', 'Gojo vs Sukuna ♾️']],
  ['Tu préfères quoi ?', ['Anime 📺', 'Manga 📖', 'Les deux 😍', 'Light novel 📚']],
];

function getSondage() {
  const [name, values] = pick(POLLS);
  return { name: `📊 ${name}`, values };
}

/* =====================================================================
   ACTU OTAKU (flux RSS)
   ===================================================================== */
const FEEDS = [
  'https://www.animenewsnetwork.com/all/rss.xml?ann-edition=w',
  'https://myanimelist.net/rss/news.xml',
  'https://www.crunchyroll.com/news/rss?lang=frFR',
];

const rss = new Parser({
  timeout: 12000,
  customFields: { item: [['media:thumbnail', 'mediaThumb'], ['media:content', 'mediaContent']] },
});

function mediaUrl(v) {
  if (!v) return null;
  if (Array.isArray(v)) v = v[0];
  if (typeof v === 'string') return v;
  return (v.$ && v.$.url) || v.url || null;
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function ogImage(link) {
  try {
    const r = await http.get(link, { timeout: 7000, responseType: 'text', maxContentLength: 2000000 });
    const html = String(r.data);
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
}

async function loadFeed(url) {
  const r = await http.get(url, { responseType: 'text', timeout: 12000 });
  const feed = await rss.parseString(r.data);
  return (feed.items || []).map((it) => ({
    title: stripHtml(it.title),
    link: it.link,
    date: new Date(it.isoDate || it.pubDate || 0),
    summary: stripHtml(it.contentSnippet || it.content || it.summary || ''),
    image:
      (it.enclosure && it.enclosure.url && /image/i.test(it.enclosure.type || 'image') ? it.enclosure.url : null) ||
      mediaUrl(it.mediaThumb) ||
      mediaUrl(it.mediaContent) ||
      ((String(it.content || '').match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || null),
  }));
}

async function getActu() {
  const results = await Promise.allSettled(FEEDS.map(loadFeed));
  let items = [];
  for (const r of results) if (r.status === 'fulfilled') items = items.concat(r.value);
  items = items.filter((i) => i.title && i.link).sort((a, b) => b.date - a.date);
  if (!items.length) throw new Error('aucune actu disponible');

  const top = items.slice(0, 25);
  const fresh = top.filter((i) => !storage.hasActuSent(i.link));
  const item = pick(fresh.length ? fresh.slice(0, 10) : top.slice(0, 10));
  storage.markActuSent(item.link);

  let summary = item.summary || '';
  if (summary.length > 240) summary = summary.slice(0, 237).trimEnd() + '…';
  const image = item.image || (await ogImage(item.link));
  return { title: item.title, summary, link: item.link, image, date: dateOnly() };
}

/* =====================================================================
   IMAGES OTAKU (SFW) & MEMES
   ===================================================================== */
async function getImage() {
  try {
    const r = await http.get(`https://nekos.best/api/v2/${pick(['waifu', 'neko', 'kitsune', 'husbando'])}`);
    const url = r.data && r.data.results && r.data.results[0] && r.data.results[0].url;
    if (url) return url;
  } catch (e) {
    /* on bascule sur waifu.pics */
  }
  const r = await http.get(`https://api.waifu.pics/sfw/${pick(['waifu', 'neko', 'shinobu', 'megumin', 'smile', 'happy', 'wink'])}`);
  if (!r.data || !r.data.url) throw new Error('aucune image');
  return r.data.url;
}

async function getMeme() {
  const subs = ['animemes', 'goodanimemes', 'Animemes', 'AnimeFunny'];
  for (let t = 0; t < 5; t++) {
    try {
      const r = await http.get(`https://meme-api.com/gimme/${pick(subs)}`);
      const d = r.data;
      if (d && d.url && !d.nsfw && !d.spoiler && /\.(jpe?g|png|webp)(\?|$)/i.test(d.url)) {
        return { url: d.url, title: d.title || '' };
      }
    } catch (e) {
      /* nouvel essai */
    }
  }
  throw new Error('aucun meme disponible');
}

/* =====================================================================
   PACKS DE STICKERS (un personnage différent à chaque fois)
   ===================================================================== */
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[Recherche] sharp indisponible : les stickers seront envoyés en images.');
}

const recentPacks = [];

async function toSticker(url) {
  const r = await http.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  return sharp(Buffer.from(r.data))
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80 })
    .toBuffer();
}

async function getStickerPack() {
  let pool = CHARS.filter((c) => !recentPacks.includes(c.n));
  if (!pool.length) pool = CHARS;
  const candidates = sample(pool, 4);

  for (const c of candidates) {
    try {
      const info = await charInfo(c);
      const urls = [];
      if (info.image) urls.push(info.image);
      try {
        const pics = await jikan(`/characters/${info.id}/pictures`);
        for (const p of (pics && pics.data) || []) {
          const u = p.image_url || (p.jpg && p.jpg.image_url) || (p.webp && p.webp.image_url);
          if (u && !urls.includes(u)) urls.push(u);
        }
      } catch (e) {
        /* on garde au moins l'image principale */
      }
      if (!urls.length) continue;

      const stickers = [];
      if (sharp) {
        for (const u of urls.slice(0, 5)) {
          try {
            stickers.push(await toSticker(u));
          } catch (e) {
            /* image ignorée */
          }
        }
      }
      recentPacks.push(c.n);
      if (recentPacks.length > 8) recentPacks.shift();
      return { name: c.n, image: urls[0], stickers, images: urls.slice(0, 5) };
    } catch (e) {
      /* personnage suivant */
    }
  }
  throw new Error('pack de stickers indisponible');
}

/* =====================================================================
   STATISTIQUES DE LA BASE
   ===================================================================== */
function bankStats() {
  const count = (l) => BANK.filter((b) => b.l === l).length;
  const dev = (l) => CHARS.filter((c) => c.l === l).length + RIDDLES.filter((r) => r[3] === l).length;
  return {
    quizz: { f: count('f'), i: count('i'), d: count('d'), total: BANK.length },
    devinettes: { f: dev('f'), i: dev('i'), d: dev('d'), total: CHARS.length + RIDDLES.length },
  };
}

module.exports = {
  CONFIG,
  LEVELS,
  nowStamp,
  dateOnly,
  normalize,
  getQuiz,
  getDevinette,
  getJeu,
  getSondage,
  getActu,
  getImage,
  getMeme,
  getStickerPack,
  bankStats,
};
