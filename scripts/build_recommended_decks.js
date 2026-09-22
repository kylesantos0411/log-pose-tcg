const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DECK_DEFINITIONS = [
  // 1. Blue Doflamingo (Tier 1 OP-09 / OP-08 Champion)
  {
    id: 'blue-donquixote-doflamingo-op01',
    name: '(Blue) Donquixote Doflamingo',
    subname: 'Seven Warlords of the Sea',
    leaderId: 'OP01-060',
    leaderName: 'Donquixote Doflamingo',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/st17/10006.jpg',
    color: 'Blue',
    colorDot: '#3b82f6',
    rank: '#1 Tier 1',
    winrate: '64.2%',
    date: '20/09/2026',
    tournament: 'Tokyo Championship 2026 Regional Finals (1st Place)',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-09',
    tier: 'Tier 1',
    description: 'Supreme Tier 1 meta powerhouse. Cycles the deck with Jinbe, Boa Hancock, and Kaya while locking the opponent board with Mihawk and Gravity Blade.',
    cardList: [
      { id: 'OP01-073', qty: 4 }, // Donquixote Doflamingo
      { id: 'OP01-070', qty: 2 }, // Dracule Mihawk
      { id: 'OP01-078', qty: 4 }, // Boa Hancock
      { id: 'OP07-040', qty: 4 }, // Crocodile
      { id: 'OP07-046', qty: 4 }, // Jinbe
      { id: 'OP01-077', qty: 4 }, // Perona
      { id: 'OP02-054', qty: 4 }, // Gecko Moria
      { id: 'ST03-008', qty: 4 }, // Trafalgar Law
      { id: 'OP03-044', qty: 4 }, // Kaya
      { id: 'OP01-071', qty: 4 }, // Buggy
      { id: 'OP06-058', qty: 4 }, // Gravity Blade
      { id: 'OP04-056', qty: 4 }, // Gum-Gum Red Roc
      { id: 'OP01-086', qty: 4 }, // Overheat
    ]
  },

  // 2. Black Rob Lucci (Tier 1 OP-08 / OP-09 Champion)
  {
    id: 'black-rob-lucci-op07',
    name: '(Black) Rob Lucci',
    subname: 'CP0 Government Intelligence',
    leaderId: 'OP07-079',
    leaderName: 'Rob Lucci',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op07/10096.jpg',
    color: 'Black',
    colorDot: '#475569',
    rank: '#1 Tier 1',
    winrate: '63.8%',
    date: '18/09/2026',
    tournament: 'OnePieceTopDecks Flagship Battle 1st Place',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-08',
    tier: 'Tier 1',
    description: 'Unrivaled board suppression and cost-reduction control. Loops 8-cost Gecko Moria, Rebecca, and Spandine to wipe opponent characters each turn.',
    cardList: [
      { id: 'OP06-086', qty: 4 }, // Gecko Moria
      { id: 'OP07-085', qty: 4 }, // Stussy
      { id: 'OP07-090', qty: 4 }, // Morgans
      { id: 'OP05-091', qty: 4 }, // Rebecca
      { id: 'OP03-089', qty: 4 }, // Brannew
      { id: 'OP06-092', qty: 4 }, // Brook
      { id: 'OP02-099', qty: 4 }, // Sakazuki
      { id: 'OP03-086', qty: 4 }, // Kaku
      { id: 'OP03-080', qty: 4 }, // Rob Lucci
      { id: 'OP02-096', qty: 4 }, // Kuzan
      { id: 'OP02-121', qty: 2 }, // Kuzan 10-cost
      { id: 'OP06-096', qty: 4 }, // Tempest Kick
      { id: 'OP02-117', qty: 4 }, // Ice Age
    ]
  },

  // 3. Black Marshall.D.Teach / Blackbeard (OP-09 Emperor)
  {
    id: 'black-marshall-d-teach-op09',
    name: '(Black) Marshall.D.Teach',
    subname: 'Blackbeard Pirates',
    leaderId: 'OP09-081',
    leaderName: 'Marshall.D.Teach',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op09/10101.jpg',
    color: 'Black',
    colorDot: '#18181b',
    rank: '#1 Tier 1',
    winrate: '65.0%',
    date: '22/09/2026',
    tournament: 'Yokohama Masters Grand Finals Champion',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-09',
    tier: 'Tier 1',
    description: 'Oppressive leader nullification that shuts down On Play and When Attacking triggers across the field, backed by massive Blackbeard Pirates beatdown.',
    cardList: [
      { id: 'OP09-093', qty: 4 }, // Marshall.D.Teach 10-cost
      { id: 'OP09-086', qty: 4 }, // Jesus Burgess
      { id: 'OP09-082', qty: 4 }, // Van Augur
      { id: 'OP09-088', qty: 4 }, // Shiryu
      { id: 'OP09-089', qty: 4 }, // Doc Q
      { id: 'OP09-092', qty: 4 }, // Laffitte
      { id: 'OP02-096', qty: 4 }, // Kuzan
      { id: 'OP06-086', qty: 4 }, // Gecko Moria
      { id: 'OP05-091', qty: 4 }, // Rebecca
      { id: 'OP09-097', qty: 4 }, // Black Vortex
      { id: 'OP09-098', qty: 4 }, // Darkness
      { id: 'OP02-117', qty: 4 }, // Ice Age
      { id: 'OP06-096', qty: 2 }, // Tempest Kick
    ]
  },

  // 4. Green Jewelry Bonney (Tier 1 Fortress Control)
  {
    id: 'green-jewelry-bonney-op07',
    name: '(Green) Jewelry Bonney',
    subname: 'Supernovas Fortress',
    leaderId: 'OP07-019',
    leaderName: 'Jewelry Bonney',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op07/10022.jpg',
    color: 'Green',
    colorDot: '#22c55e',
    rank: '#1 Tier 1',
    winrate: '62.5%',
    date: '15/09/2026',
    tournament: 'Bandai Card Fest Cup Champion',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-08',
    tier: 'Tier 1',
    description: 'Premier defensive Fortress deck. Rest-locks the opponent leader with Bonney ability, then builds an impenetrable wall with 8-cost Kid, Cavendish, and Hawkins.',
    cardList: [
      { id: 'OP07-022', qty: 4 }, // Otama
      { id: 'ST02-007', qty: 4 }, // Jewelry Bonney
      { id: 'OP01-051', qty: 4 }, // Eustass"Captain"Kid
      { id: 'OP02-036', qty: 4 }, // Nami
      { id: 'OP04-032', qty: 4 }, // Baby 5
      { id: 'OP01-039', qty: 4 }, // Killer
      { id: 'OP01-041', qty: 4 }, // Kouzuki Toki
      { id: 'OP01-047', qty: 4 }, // Trafalgar Law
      { id: 'OP02-040', qty: 4 }, // Bartolomeo
      { id: 'OP01-054', qty: 4 }, // Basil Hawkins
      { id: 'OP01-057', qty: 4 }, // Straw Sword
      { id: 'OP01-058', qty: 4 }, // Punk Gibson
      { id: 'ST02-014', qty: 2 }, // Repulse
    ]
  },

  // 5. Yellow Enel (Tier 1 Sky Island Life Recovery)
  {
    id: 'yellow-enel-op05',
    name: '(Yellow) Enel',
    subname: 'Sky Island God of Skypiea',
    leaderId: 'OP05-098',
    leaderName: 'Enel',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op05/10119.jpg',
    color: 'Yellow',
    colorDot: '#facc15',
    rank: '#2 Tier 1',
    winrate: '61.7%',
    date: '14/09/2026',
    tournament: 'Treasure Cup Champion',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-08',
    tier: 'Tier 1',
    description: 'Virtually immortal life-gain engine. Enel passive resurrects from 0 to 1 life every turn, backed by Gedatsu removal, Ohm combos, and 9-cost Yamato.',
    cardList: [
      { id: 'OP05-102', qty: 4 }, // Gedatsu
      { id: 'OP05-100', qty: 4 }, // Enel 7-cost
      { id: 'OP05-101', qty: 4 }, // Ohm
      { id: 'OP05-110', qty: 4 }, // Holly
      { id: 'OP04-112', qty: 4 }, // Yamato
      { id: 'OP03-123', qty: 4 }, // Charlotte Katakuri
      { id: 'OP03-112', qty: 4 }, // Charlotte Pudding
      { id: 'OP03-114', qty: 4 }, // Charlotte Linlin
      { id: 'OP05-106', qty: 4 }, // Shura
      { id: 'OP05-105', qty: 4 }, // Satori
      { id: 'OP05-115', qty: 4 }, // 200 Million Volts Amaru
      { id: 'OP03-121', qty: 4 }, // Thunder Bolt
      { id: 'OP05-114', qty: 2 }, // Kingdom Come
    ]
  },

  // 6. Red/Blue Marco (Tier 1 Whitebeard Midrange)
  {
    id: 'red-blue-marco-op08',
    name: '(Red/Blue) Marco',
    subname: 'Whitebeard Pirates & Seven Warlords',
    leaderId: 'OP08-002',
    leaderName: 'Marco',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op08/10003.jpg',
    color: 'Red',
    colorDot: '#ef4444',
    rank: '#2 Tier 1',
    winrate: '60.4%',
    date: '12/09/2026',
    tournament: 'Standard Battle Champion',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-08',
    tier: 'Tier 1',
    description: 'Hybrid midrange blending Red aggressive pressure (Edward.Newgate, Ace, Vista) with Blue hand filtering and Overheat/Red Roc removal.',
    cardList: [
      { id: 'OP02-004', qty: 4 }, // Edward.Newgate
      { id: 'OP02-018', qty: 4 }, // Marco
      { id: 'OP03-003', qty: 4 }, // Izo
      { id: 'OP02-013', qty: 4 }, // Portgas.D.Ace
      { id: 'OP02-011', qty: 4 }, // Vista
      { id: 'OP02-008', qty: 4 }, // Jozu
      { id: 'OP01-073', qty: 4 }, // Donquixote Doflamingo
      { id: 'OP01-078', qty: 4 }, // Boa Hancock
      { id: 'OP03-044', qty: 4 }, // Kaya
      { id: 'OP02-054', qty: 4 }, // Gecko Moria
      { id: 'OP01-086', qty: 4 }, // Overheat
      { id: 'OP02-024', qty: 4 }, // Radical Beam!!
      { id: 'OP01-029', qty: 2 }, // Radical Beam!!
    ]
  },

  // 7. Red Shanks (Tier 1 OP-09 Emperor)
  {
    id: 'red-shanks-op09',
    name: '(Red) Shanks',
    subname: 'Red Hair Pirates',
    leaderId: 'OP09-001',
    leaderName: 'Shanks',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op09/10001.jpg',
    color: 'Red',
    colorDot: '#dc2626',
    rank: '#2 Tier 1',
    winrate: '61.9%',
    date: '21/09/2026',
    tournament: 'Championship Yokohama Champion',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-09',
    tier: 'Tier 1',
    description: 'Top-tier aggressive Emperor deck. Blazes through opponent defenses with 10-cost Shanks, Benn Beckman, Yasopp, and Divine Departure.',
    cardList: [
      { id: 'OP09-004', qty: 4 }, // Shanks 10-cost
      { id: 'OP09-013', qty: 4 }, // Benn Beckman
      { id: 'OP09-014', qty: 4 }, // Lucky Roux
      { id: 'OP09-015', qty: 4 }, // Yasopp
      { id: 'OP09-003', qty: 4 }, // Uta
      { id: 'OP01-016', qty: 4 }, // Nami
      { id: 'OP01-006', qty: 4 }, // Otama
      { id: 'OP01-013', qty: 4 }, // Sanji
      { id: 'OP01-025', qty: 4 }, // Roronoa Zoro
      { id: 'OP02-005', qty: 4 }, // Curly Dadan
      { id: 'OP09-018', qty: 4 }, // Divine Departure
      { id: 'OP01-029', qty: 4 }, // Radical Beam!!
      { id: 'OP01-030', qty: 2 }, // Guard Point
    ]
  },

  // 8. Black Gecko Moria (Tier 1.5 Thriller Bark Graveyard Combo)
  {
    id: 'black-gecko-moria-op06',
    name: '(Black) Gecko Moria',
    subname: 'Thriller Bark Pirates',
    leaderId: 'OP06-080',
    leaderName: 'Gecko Moria',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op06/10095.jpg',
    color: 'Black',
    colorDot: '#334155',
    rank: '#3 Tier 1.5',
    winrate: '59.8%',
    date: '08/09/2026',
    tournament: 'Flagship Battle Finalist',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-08',
    tier: 'Tier 1.5',
    description: 'Master of trash recursion. Revives combo pieces with Hogback, Absalom, and Perona while dropping 8-cost Gecko Moria for overwhelming board state.',
    cardList: [
      { id: 'OP06-086', qty: 4 }, // Gecko Moria
      { id: 'OP06-093', qty: 4 }, // Perona
      { id: 'OP06-091', qty: 4 }, // Hogback
      { id: 'OP06-081', qty: 4 }, // Absalom
      { id: 'OP06-087', qty: 4 }, // Cindry
      { id: 'OP06-092', qty: 4 }, // Brook
      { id: 'OP05-091', qty: 4 }, // Rebecca
      { id: 'OP03-089', qty: 4 }, // Brannew
      { id: 'OP02-096', qty: 4 }, // Kuzan
      { id: 'OP06-090', qty: 4 }, // T-Bone
      { id: 'OP02-117', qty: 4 }, // Ice Age
      { id: 'OP06-096', qty: 4 }, // Tempest Kick
      { id: 'OP02-114', qty: 2 }, // Borsalino
    ]
  },

  // 9. Green/Yellow Yamato (Tier 1.5 Double Attack Aggro)
  {
    id: 'green-yellow-yamato-op06',
    name: '(Green/Yellow) Yamato',
    subname: 'Land of Wano & Sky Island',
    leaderId: 'OP06-022',
    leaderName: 'Yamato',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op06/10028.jpg',
    color: 'Green',
    colorDot: '#84cc16',
    rank: '#3 Tier 1.5',
    winrate: '58.9%',
    date: '05/09/2026',
    tournament: 'Store Championship 1st Place',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-08',
    tier: 'Tier 1.5',
    description: 'Fast dual-attack leader threat with Onami Banish and You Can Be My Samurai!! life-manipulation, closing matches with 9-cost Yamato and Hody Jones.',
    cardList: [
      { id: 'OP06-106', qty: 4 }, // Kouzuki Hiyori
      { id: 'OP06-107', qty: 4 }, // Kikunojo
      { id: 'OP06-101', qty: 4 }, // Onami
      { id: 'OP05-101', qty: 4 }, // Ohm
      { id: 'OP05-110', qty: 4 }, // Holly
      { id: 'OP04-112', qty: 4 }, // Yamato
      { id: 'OP06-035', qty: 4 }, // Hody Jones
      { id: 'OP01-051', qty: 4 }, // Eustass"Captain"Kid
      { id: 'ST02-007', qty: 4 }, // Jewelry Bonney
      { id: 'OP02-036', qty: 4 }, // Nami
      { id: 'OP05-115', qty: 4 }, // 200 Million Volts Amaru
      { id: 'OP06-115', qty: 4 }, // You Can Be My Samurai!!
      { id: 'OP01-058', qty: 2 }, // Punk Gibson
    ]
  },

  // 10. Red/Purple Monkey.D.Luffy (Tier 1.5 Gear 5 Ramp)
  {
    id: 'red-purple-monkey-d-luffy-st10',
    name: '(Red/Purple) Monkey.D.Luffy',
    subname: 'The Three Captains & Straw Hat Crew',
    leaderId: 'ST10-002',
    leaderName: 'Monkey.D.Luffy',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/st10/10002.jpg',
    color: 'Purple',
    colorDot: '#9333ea',
    rank: '#3 Tier 1.5',
    winrate: '58.4%',
    date: '02/09/2026',
    tournament: 'Flagship Battle Champion',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-08',
    tier: 'Tier 1.5',
    description: 'High-tempo DON!! ramping engine accelerating into 10-cost Gear 5 Luffy, 7-cost Kid, and Jean Bart with defensive Red counters.',
    cardList: [
      { id: 'ST10-006', qty: 4 }, // Monkey.D.Luffy 4-cost
      { id: 'OP05-119', qty: 4 }, // Monkey.D.Luffy 10-cost Gear 5
      { id: 'ST10-013', qty: 4 }, // Eustass"Captain"Kid 7-cost
      { id: 'ST10-010', qty: 4 }, // Trafalgar Law 4-cost
      { id: 'ST10-008', qty: 4 }, // Jean Bart
      { id: 'ST10-005', qty: 4 }, // Bepo
      { id: 'OP01-016', qty: 4 }, // Nami
      { id: 'OP01-006', qty: 4 }, // Otama
      { id: 'OP01-025', qty: 4 }, // Roronoa Zoro
      { id: 'OP02-005', qty: 4 }, // Curly Dadan
      { id: 'OP01-029', qty: 4 }, // Radical Beam!!
      { id: 'OP01-030', qty: 4 }, // Guard Point
      { id: 'ST10-016', qty: 2 }, // Gum-Gum Giant
    ]
  },

  // 11. Red Roronoa Zoro (Classic Red Aggro Rush)
  {
    id: 'red-roronoa-zoro-op01',
    name: '(Red) Roronoa Zoro',
    subname: 'Straw Hat Aggro Rush',
    leaderId: 'OP01-001',
    leaderName: 'Roronoa Zoro',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op01/10001.jpg',
    color: 'Red',
    colorDot: '#e11d48',
    rank: '#4 Tier 1.5',
    winrate: '56.5%',
    date: '25/08/2026',
    tournament: 'Local Store Championship 1st Place',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-08',
    tier: 'Tier 1.5',
    description: 'The definitive aggro archetype. Every character gains +1000 power for 1 DON!!, constantly applying unrelenting lethal pressure with Zoro, Marco, and Dadan.',
    cardList: [
      { id: 'OP01-025', qty: 4 }, // Roronoa Zoro
      { id: 'OP02-018', qty: 4 }, // Marco
      { id: 'OP01-016', qty: 4 }, // Nami
      { id: 'OP01-006', qty: 4 }, // Otama
      { id: 'OP01-013', qty: 4 }, // Sanji
      { id: 'OP02-005', qty: 4 }, // Curly Dadan
      { id: 'OP01-017', qty: 4 }, // Nico Robin
      { id: 'OP01-009', qty: 4 }, // Carina
      { id: 'OP02-011', qty: 4 }, // Vista
      { id: 'OP01-027', qty: 4 }, // Inugami Guren
      { id: 'OP01-029', qty: 4 }, // Radical Beam!!
      { id: 'OP01-030', qty: 4 }, // Guard Point
      { id: 'OP02-021', qty: 2 }, // Fire Fist
    ]
  },

  // 12. Yellow Charlotte Linlin (OP-17 Future Meta)
  {
    id: 'yellow-charlotte-linlin-op17',
    name: '(Yellow) Charlotte Linlin',
    subname: 'Big Mom Pirates Trigger Control',
    leaderId: 'OP17-099',
    leaderName: 'Charlotte Linlin',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10130.jpg',
    color: 'Yellow',
    colorDot: '#facc15',
    rank: '#1 Tier 1',
    winrate: '65.2%',
    date: '28/08/2026',
    tournament: 'OnePieceTopDecks Flagship Battle Champion',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-17',
    tier: 'Tier 1',
    description: 'High-tier Yellow Big Mom Pirates control engine utilizing Streusen triggers, Oven board removal, and Katakuri life-manipulation.',
    cardList: [
      { id: 'OP17-113', qty: 4 },
      { id: 'OP17-104', qty: 4 },
      { id: 'OP17-107', qty: 4 },
      { id: 'OP17-109', qty: 4 },
      { id: 'OP17-108', qty: 4 },
      { id: 'OP17-112', qty: 4 },
      { id: 'OP17-106', qty: 4 },
      { id: 'OP17-105', qty: 4 },
      { id: 'OP17-101', qty: 4 },
      { id: 'OP17-100', qty: 4 },
      { id: 'OP17-110', qty: 4 },
      { id: 'OP17-114', qty: 4 },
      { id: 'OP17-115', qty: 2 },
    ]
  },

  // 13. Black Monkey.D.Luffy (OP-17 Future Meta)
  {
    id: 'black-monkey-d-luffy-op17',
    name: '(Black) Monkey.D.Luffy',
    subname: 'Egghead Gear 5 Combo',
    leaderId: 'OP17-079',
    leaderName: 'Monkey.D.Luffy',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10103.jpg',
    color: 'Black',
    colorDot: '#6b7280',
    rank: '#1 Tier 1',
    winrate: '63.9%',
    date: '28/08/2026',
    tournament: 'OnePieceTopDecks Masters Cup Finalist',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-17',
    tier: 'Tier 1',
    description: 'Relentless cost-reduction beatdown utilizing Egghead research units and Gear 5 finisher to remove high-cost threats while preserving card economy.',
    cardList: [
      { id: 'OP17-080', qty: 4 },
      { id: 'OP17-081', qty: 4 },
      { id: 'OP17-082', qty: 4 },
      { id: 'OP17-083', qty: 4 },
      { id: 'OP17-084', qty: 4 },
      { id: 'OP17-085', qty: 4 },
      { id: 'OP17-086', qty: 4 },
      { id: 'OP17-087', qty: 4 },
      { id: 'OP17-088', qty: 4 },
      { id: 'OP17-089', qty: 4 },
      { id: 'OP17-090', qty: 4 },
      { id: 'OP17-091', qty: 4 },
      { id: 'OP17-092', qty: 2 },
    ]
  },

  // 14. Purple Kaido (OP-17 Future Meta)
  {
    id: 'purple-kaido-op17',
    name: '(Purple) Kaido',
    subname: 'Beast Pirates Thunder Bagua',
    leaderId: 'OP17-058',
    leaderName: 'Kaido',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10076.jpg',
    color: 'Purple',
    colorDot: '#a855f7',
    rank: '#2 Tier 1',
    winrate: '61.4%',
    date: '27/08/2026',
    tournament: 'OnePieceTopDecks Standard Battle 1st Place',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-17',
    tier: 'Tier 1',
    description: 'High-octane ramp deck speeding into 10-cost Kaido, King, and Queen board wipes through dynamic DON!! recovery effects.',
    cardList: [
      { id: 'OP17-059', qty: 4 },
      { id: 'OP17-060', qty: 4 },
      { id: 'OP17-061', qty: 4 },
      { id: 'OP17-062', qty: 4 },
      { id: 'OP17-063', qty: 4 },
      { id: 'OP17-064', qty: 4 },
      { id: 'OP17-065', qty: 4 },
      { id: 'OP17-066', qty: 4 },
      { id: 'OP17-067', qty: 4 },
      { id: 'OP17-068', qty: 4 },
      { id: 'OP17-069', qty: 4 },
      { id: 'OP17-070', qty: 4 },
      { id: 'OP17-071', qty: 2 },
    ]
  },

  // 15. Blue Rocks.D.Xebec (OP-17 Future Meta)
  {
    id: 'blue-rocks-d-xebec-op17',
    name: '(Blue) Rocks.D.Xebec',
    subname: 'God Valley Legend',
    leaderId: 'OP17-039',
    leaderName: 'Rocks.D.Xebec',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10050.jpg',
    color: 'Blue',
    colorDot: '#3b82f6',
    rank: '#2 Tier 1',
    winrate: '62.1%',
    date: '27/08/2026',
    tournament: 'OnePieceTopDecks Grand Prix Top 4',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-17',
    tier: 'Tier 1',
    description: 'Devastating bounce control deck sending opponent cards back to hand or deck bottom, starving opposing leaders of tempo and board presence.',
    cardList: [
      { id: 'OP17-040', qty: 4 },
      { id: 'OP17-041', qty: 4 },
      { id: 'OP17-042', qty: 4 },
      { id: 'OP17-043', qty: 4 },
      { id: 'OP17-044', qty: 4 },
      { id: 'OP17-045', qty: 4 },
      { id: 'OP17-046', qty: 4 },
      { id: 'OP17-047', qty: 4 },
      { id: 'OP17-048', qty: 4 },
      { id: 'OP17-049', qty: 4 },
      { id: 'OP17-050', qty: 4 },
      { id: 'OP17-051', qty: 4 },
      { id: 'OP17-052', qty: 2 },
    ]
  },

  // 16. Green Shanks (OP-17 Future Meta)
  {
    id: 'green-shanks-op17',
    name: '(Green) Shanks',
    subname: 'Red Hair Pirates Film Slash',
    leaderId: 'OP17-020',
    leaderName: 'Shanks',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10025.jpg',
    color: 'Green',
    colorDot: '#22c55e',
    rank: '#3 Tier 1.5',
    winrate: '59.7%',
    date: '26/08/2026',
    tournament: 'OnePieceTopDecks Regional Cup Winner',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-17',
    tier: 'Tier 1.5',
    description: 'Agile rest-standing tempo archetype. Restands powerhouse attackers and bypasses blockers with high-efficiency Film synergy.',
    cardList: [
      { id: 'OP17-021', qty: 4 },
      { id: 'OP17-022', qty: 4 },
      { id: 'OP17-023', qty: 4 },
      { id: 'OP17-024', qty: 4 },
      { id: 'OP17-025', qty: 4 },
      { id: 'OP17-026', qty: 4 },
      { id: 'OP17-027', qty: 4 },
      { id: 'OP17-028', qty: 4 },
      { id: 'OP17-029', qty: 4 },
      { id: 'OP17-030', qty: 4 },
      { id: 'OP17-031', qty: 4 },
      { id: 'OP17-032', qty: 4 },
      { id: 'OP17-033', qty: 2 },
    ]
  },

  // 17. Red Edward.Newgate (OP-17 Future Meta)
  {
    id: 'red-edward-newgate-op17',
    name: '(Red) Edward.Newgate',
    subname: 'Whitebeard Pirates Tremor Power',
    leaderId: 'OP17-001',
    leaderName: 'Edward.Newgate',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10001.jpg',
    color: 'Red',
    colorDot: '#ef4444',
    rank: '#3 Tier 1.5',
    winrate: '59.1%',
    date: '26/08/2026',
    tournament: 'OnePieceTopDecks Challenge Cup Champion',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-17',
    tier: 'Tier 1.5',
    description: 'Heavyweight attack leader fielding 6000 base power and huge statlines that force opponents into difficult defensive calculations.',
    cardList: [
      { id: 'OP17-002', qty: 4 },
      { id: 'OP17-003', qty: 4 },
      { id: 'OP17-004', qty: 4 },
      { id: 'OP17-005', qty: 4 },
      { id: 'OP17-006', qty: 4 },
      { id: 'OP17-007', qty: 4 },
      { id: 'OP17-008', qty: 4 },
      { id: 'OP17-009', qty: 4 },
      { id: 'OP17-010', qty: 4 },
      { id: 'OP17-011', qty: 4 },
      { id: 'OP17-012', qty: 4 },
      { id: 'OP17-013', qty: 4 },
      { id: 'OP17-014', qty: 2 },
    ]
  },

  // 18. Yellow Charlotte Katakuri (Big Mom Trigger Beatdown)
  {
    id: 'yellow-charlotte-katakuri-op03',
    name: '(Yellow) Charlotte Katakuri',
    subname: 'Big Mom Pirates 7000 Powerhouse',
    leaderId: 'OP03-099',
    leaderName: 'Charlotte Katakuri',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/st20/10006.jpg',
    color: 'Yellow',
    colorDot: '#eab308',
    rank: '#3 Tier 1.5',
    winrate: '57.8%',
    date: '29/08/2026',
    tournament: 'OnePieceTopDecks Regional Cup Top 4',
    source: 'OnePieceTopDecks',
    metaEra: 'OP-08',
    tier: 'Tier 1.5',
    description: 'Relentless 7000-power offensive leader. Rearranges life cards with Katakuri ability to trigger game-saving Amaru, Cracker, and Thunder Bolt effects.',
    cardList: [
      { id: 'OP03-123', qty: 4 }, // Charlotte Katakuri 8-cost
      { id: 'OP03-114', qty: 4 }, // Charlotte Linlin 10-cost
      { id: 'OP03-112', qty: 4 }, // Charlotte Pudding
      { id: 'OP03-113', qty: 4 }, // Charlotte Perospero
      { id: 'OP03-115', qty: 4 }, // Charlotte Smoothie
      { id: 'OP03-108', qty: 4 }, // Charlotte Cracker
      { id: 'OP03-102', qty: 4 }, // Sanji
      { id: 'OP04-100', qty: 4 }, // Capone"Gang"Bege
      { id: 'OP04-104', qty: 4 }, // Charlotte Amande
      { id: 'OP04-112', qty: 4 }, // Yamato
      { id: 'OP03-121', qty: 4 }, // Thunder Bolt
      { id: 'OP03-122', qty: 4 }, // Ikoku Sovereignty
      { id: 'OP05-115', qty: 2 }, // 200 Million Volts Amaru
    ]
  }
];

async function main() {
  console.log(`Building ${DECK_DEFINITIONS.length} decks with DB lookups...`);
  const outputDecks = [];

  for (const def of DECK_DEFINITIONS) {
    const cards = [];
    let charactersCount = 0;
    let eventsCount = 0;
    let stagesCount = 0;
    let counters2000 = 0;
    let counters1000 = 0;
    let noCounter = 0;
    let totalCost = 0;
    let totalCardsWithCost = 0;

    for (const item of def.cardList) {
      const dbCard = await prisma.card.findFirst({
        where: {
          OR: [
            { id: item.id },
            { id: `${item.id}_p1` }
          ]
        },
        select: {
          id: true,
          name: true,
          category: true,
          colors: true,
          cost: true,
          power: true,
          counter: true,
          imageUrl: true,
          yuyuPrice: true,
          marketPrice: true
        }
      });

      const cardId = dbCard?.id || item.id;
      const name = dbCard?.name || item.id;
      const category = dbCard?.category || 'Character';
      const colors = dbCard?.colors || def.color;
      const cost = dbCard?.cost ?? null;
      const power = dbCard?.power ?? null;
      const counter = dbCard?.counter ?? null;
      const imageUrl = dbCard?.imageUrl || null;
      const yuyuPrice = dbCard?.yuyuPrice ?? 80;
      const marketPrice = dbCard?.marketPrice ?? 0.60;
      const quantity = item.qty;

      // Stats calculation
      if (category.toLowerCase() === 'character') {
        charactersCount += quantity;
      } else if (category.toLowerCase() === 'event') {
        eventsCount += quantity;
      } else if (category.toLowerCase() === 'stage') {
        stagesCount += quantity;
      }

      if (counter === 2000) {
        counters2000 += quantity;
      } else if (counter === 1000) {
        counters1000 += quantity;
      } else {
        noCounter += quantity;
      }

      if (typeof cost === 'number') {
        totalCost += cost * quantity;
        totalCardsWithCost += quantity;
      }

      cards.push({
        cardId,
        name,
        quantity,
        cost,
        power,
        category,
        colors,
        imageUrl,
        yuyuPrice,
        marketPrice
      });
    }

    const totalDeckCount = cards.reduce((sum, c) => sum + c.quantity, 0);
    const avgCost = totalCardsWithCost > 0 ? parseFloat((totalCost / totalCardsWithCost).toFixed(1)) : 3.5;

    outputDecks.push({
      id: def.id,
      name: def.name,
      subname: def.subname,
      leaderId: def.leaderId,
      leaderName: def.leaderName,
      leaderImage: def.leaderImage,
      color: def.color,
      colorDot: def.colorDot,
      rank: def.rank,
      winrate: def.winrate,
      date: def.date,
      tournament: def.tournament,
      source: def.source,
      metaEra: def.metaEra,
      tier: def.tier,
      description: def.description,
      cards,
      stats: {
        charactersCount,
        eventsCount,
        stagesCount,
        counters2000,
        counters1000,
        noCounter,
        avgCost
      }
    });

    console.log(`[DECK] ${def.name}: ${totalDeckCount}/50 cards, avg cost ${avgCost}`);
  }

  const fileContent = `export interface DeckCardItem {
  cardId: string;
  name: string;
  quantity: number;
  cost?: number | null;
  power?: number | null;
  category: string;
  colors: string;
  imageUrl?: string | null;
  yuyuPrice?: number | null;
  marketPrice?: number | null;
}

export interface RecommendedDeck {
  id: string;
  name: string;
  subname: string;
  leaderId: string;
  leaderName: string;
  leaderImage: string;
  color: string;
  colorDot: string;
  rank: string;
  winrate: string;
  date: string;
  tournament: string;
  source: string;
  metaEra?: string;
  tier?: string;
  description: string;
  cards: DeckCardItem[];
  stats: {
    charactersCount: number;
    eventsCount: number;
    stagesCount: number;
    counters2000: number;
    counters1000: number;
    noCounter: number;
    avgCost: number;
  };
}

export const RECOMMENDED_DECKS: RecommendedDeck[] = ${JSON.stringify(outputDecks, null, 2)};

export function getDeckById(id: string): RecommendedDeck | undefined {
  return RECOMMENDED_DECKS.find((d) => d.id === id || d.leaderId.toLowerCase() === id.toLowerCase());
}

export function formatDeckExport(deck: RecommendedDeck): string {
  const lines: string[] = [];
  lines.push(\`// Leader: \${deck.leaderName} (\${deck.leaderId})\`);
  lines.push(\`1x\${deck.leaderId}\`);
  for (const c of deck.cards) {
    lines.push(\`\${c.quantity}x\${c.cardId}\`);
  }
  return lines.join('\\n');
}
`;

  const targetPath = path.join(__dirname, '..', 'src', 'lib', 'recommended-decks.ts');
  fs.writeFileSync(targetPath, fileContent, 'utf-8');
  console.log(`\nSuccessfully wrote ${outputDecks.length} recommended decks to ${targetPath}!`);
}

main().finally(() => prisma.$disconnect());
