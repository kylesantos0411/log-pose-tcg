export interface DeckCardItem {
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

export const RECOMMENDED_DECKS: RecommendedDeck[] = [
  {
    id: 'yellow-charlotte-linlin-op17',
    name: '(Yellow) Charlotte Linlin',
    subname: 'Charlotte Linlin',
    leaderId: 'OP17-099',
    leaderName: 'Charlotte Linlin',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10130.jpg',
    color: 'Yellow',
    colorDot: '#facc15',
    rank: '#1',
    winrate: '0%',
    date: '28/08/2026',
    tournament: 'OnePieceTopDecks Flagship Battle Champion',
    source: 'OnePieceTopDecks',
    description: 'High-tier Yellow Big Mom Pirates control engine utilizing Streusen triggers, Oven board removal, and Katakuri life-manipulation.',
    cards: [
      {
        cardId: 'OP17-113',
        name: 'Streusen',
        quantity: 4,
        cost: 1,
        power: 2000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10148.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-104',
        name: 'Charlotte Cracker',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10136.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-107',
        name: 'Charlotte Daifuku',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10139.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-109',
        name: 'Charlotte Pudding',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10142.jpg',
        yuyuPrice: 320,
        marketPrice: 2.29
      },
      {
        cardId: 'OP17-111',
        name: "Charlotte Mont-d'or",
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10144.jpg',
        yuyuPrice: 50,
        marketPrice: 0.36
      },
      {
        cardId: 'ST20-003',
        name: 'Charlotte Brulee',
        quantity: 4,
        cost: 3,
        power: 3000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/st20/10003.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-102',
        name: 'Charlotte Oven',
        quantity: 4,
        cost: 4,
        power: 4000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10134.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-106',
        name: 'Charlotte Smoothie',
        quantity: 4,
        cost: 5,
        power: 4000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10138.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-103',
        name: 'Charlotte Katakuri',
        quantity: 4,
        cost: 6,
        power: 4000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10135.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-112',
        name: 'Charlotte Linlin',
        quantity: 4,
        cost: 10,
        power: 12000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10145.jpg',
        yuyuPrice: 420,
        marketPrice: 3.0
      },
      {
        cardId: 'OP17-100',
        name: 'Capone"Gang"Bege',
        quantity: 4,
        cost: 7,
        power: 8000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10132.jpg',
        yuyuPrice: 180,
        marketPrice: 1.25
      },
      {
        cardId: 'OP17-114',
        name: 'Sweet 3 Generals',
        quantity: 2,
        cost: 6,
        power: 4000,
        category: 'Character',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10149.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-116',
        name: 'Fulgora',
        quantity: 2,
        cost: 1,
        power: null,
        category: 'Event',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10151.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-117',
        name: 'Maser Saber',
        quantity: 2,
        cost: 1,
        power: null,
        category: 'Event',
        colors: 'Yellow',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10152.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      }
    ],
    stats: {
      charactersCount: 46,
      eventsCount: 4,
      stagesCount: 0,
      counters2000: 12,
      counters1000: 24,
      noCounter: 14,
      avgCost: 3.7
    }
  },
  {
    id: 'black-monkey-d-luffy-op17',
    name: '(Black) Monkey.D.Luffy',
    subname: 'Monkey.D.Luffy',
    leaderId: 'OP17-079',
    leaderName: 'Monkey.D.Luffy',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10104.jpg',
    color: 'Black',
    colorDot: '#1f2937',
    rank: '#2',
    winrate: '0%',
    date: '28/08/2026',
    tournament: 'Tokyo Championship Top 4',
    source: 'OnePieceTopDecks',
    description: 'Black Straw Hat & Elbaf Giant Warriors ramp deck featuring massive attack combos and turn-5 board dominance.',
    cards: [
      {
        cardId: 'OP17-080',
        name: 'Usopp',
        quantity: 4,
        cost: 1,
        power: 2000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10107.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-086',
        name: 'Nami',
        quantity: 4,
        cost: 1,
        power: 1000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10113.jpg',
        yuyuPrice: 280,
        marketPrice: 2.0
      },
      {
        cardId: 'OP17-084',
        name: 'Tony Tony.Chopper',
        quantity: 4,
        cost: 2,
        power: 3000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10111.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-082',
        name: 'Sanji',
        quantity: 4,
        cost: 4,
        power: 5000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10109.jpg',
        yuyuPrice: 150,
        marketPrice: 1.05
      },
      {
        cardId: 'OP17-095',
        name: 'Roronoa Zoro',
        quantity: 4,
        cost: 5,
        power: 7000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10122.jpg',
        yuyuPrice: 250,
        marketPrice: 1.75
      },
      {
        cardId: 'OP17-085',
        name: 'Dorry',
        quantity: 4,
        cost: 6,
        power: 7000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10112.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      },
      {
        cardId: 'OP17-092',
        name: 'Brogy',
        quantity: 4,
        cost: 6,
        power: 7000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10119.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      },
      {
        cardId: 'OP17-083',
        name: 'Jinbe',
        quantity: 4,
        cost: 4,
        power: 6000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10110.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-093',
        name: 'Monkey.D.Luffy',
        quantity: 4,
        cost: 7,
        power: 8000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10120.jpg',
        yuyuPrice: 380,
        marketPrice: 2.7
      },
      {
        cardId: 'OP17-119',
        name: 'Loki',
        quantity: 4,
        cost: 8,
        power: 9000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10126.jpg',
        yuyuPrice: 480,
        marketPrice: 3.4
      },
      {
        cardId: 'OP17-090',
        name: 'Franky',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10117.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-096',
        name: "I'm Luffy!! The Man Who Will Be King of the Pirates!!",
        quantity: 4,
        cost: 1,
        power: null,
        category: 'Event',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10123.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-098',
        name: 'Gum-Gum Kong Gun',
        quantity: 2,
        cost: 2,
        power: null,
        category: 'Event',
        colors: 'Black',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10125.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      }
    ],
    stats: {
      charactersCount: 44,
      eventsCount: 6,
      stagesCount: 0,
      counters2000: 12,
      counters1000: 24,
      noCounter: 14,
      avgCost: 3.9
    }
  },
  {
    id: 'purple-kaido-op17',
    name: '(Purple) Kaido',
    subname: 'Kaido',
    leaderId: 'OP17-058',
    leaderName: 'Kaido',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10076.jpg',
    color: 'Purple',
    colorDot: '#a855f7',
    rank: '#3',
    winrate: '0%',
    date: '28/08/2026',
    tournament: 'Osaka Regional 2nd Place',
    source: 'OnePieceTopDecks',
    description: 'Animal Kingdom ramp powerhouse with quick DON!! acceleration, board wipes, and King & Queen synergy.',
    cards: [
      {
        cardId: 'OP17-066',
        name: 'Kurozumi Orochi',
        quantity: 4,
        cost: 1,
        power: 1000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10086.jpg',
        yuyuPrice: 50,
        marketPrice: 0.36
      },
      {
        cardId: 'OP17-070',
        name: 'Scratchmen Apoo',
        quantity: 4,
        cost: 2,
        power: 3000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10091.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-060',
        name: 'Ulti & Page One',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10079.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-072',
        name: 'Black Maria',
        quantity: 4,
        cost: 3,
        power: 2000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10093.jpg',
        yuyuPrice: 200,
        marketPrice: 1.42
      },
      {
        cardId: 'OP17-068',
        name: 'Sasaki',
        quantity: 4,
        cost: 4,
        power: 5000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10088.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-065',
        name: 'Queen',
        quantity: 4,
        cost: 5,
        power: 6000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10085.jpg',
        yuyuPrice: 320,
        marketPrice: 2.29
      },
      {
        cardId: 'OP17-064',
        name: 'King',
        quantity: 4,
        cost: 6,
        power: 7000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10084.jpg',
        yuyuPrice: 280,
        marketPrice: 2.0
      },
      {
        cardId: 'OP17-069',
        name: 'Jack',
        quantity: 4,
        cost: 7,
        power: 8000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10089.jpg',
        yuyuPrice: 180,
        marketPrice: 1.25
      },
      {
        cardId: 'OP17-062',
        name: 'Kaido',
        quantity: 4,
        cost: 9,
        power: 10000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10081.jpg',
        yuyuPrice: 450,
        marketPrice: 3.2
      },
      {
        cardId: 'OP17-063',
        name: 'Kaido',
        quantity: 4,
        cost: 10,
        power: 12000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10082.jpg',
        yuyuPrice: 550,
        marketPrice: 3.9
      },
      {
        cardId: 'OP17-074',
        name: 'Yamato',
        quantity: 4,
        cost: 5,
        power: 6000,
        category: 'Character',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10095.jpg',
        yuyuPrice: 220,
        marketPrice: 1.55
      },
      {
        cardId: 'OP17-077',
        name: 'Kundali Dragon Swarm',
        quantity: 4,
        cost: 2,
        power: null,
        category: 'Event',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10098.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      },
      {
        cardId: 'OP17-078',
        name: 'Drunken Dragon Bagua',
        quantity: 2,
        cost: 1,
        power: null,
        category: 'Event',
        colors: 'Purple',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10099.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      }
    ],
    stats: {
      charactersCount: 44,
      eventsCount: 6,
      stagesCount: 0,
      counters2000: 12,
      counters1000: 20,
      noCounter: 18,
      avgCost: 4.8
    }
  },
  {
    id: 'blue-rocks-d-xebec-op17',
    name: '(Blue) Rocks.D.Xebec',
    subname: 'Rocks.D.Xebec',
    leaderId: 'OP17-039',
    leaderName: 'Rocks.D.Xebec',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10051.jpg',
    color: 'Blue',
    colorDot: '#0284c7',
    rank: '#4',
    winrate: '0%',
    date: '28/08/2026',
    tournament: 'Standard Battle Asia Winner',
    source: 'OnePieceTopDecks',
    description: 'Blue tempo control fielding legendary Rocks Pirates: Young Kaido, Young Newgate, and Young Linlin.',
    cards: [
      {
        cardId: 'OP17-050',
        name: 'Streusen',
        quantity: 4,
        cost: 1,
        power: 2000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10067.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-046',
        name: 'Gloriosa',
        quantity: 4,
        cost: 2,
        power: 3000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10061.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-044',
        name: 'Captain John',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10059.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      },
      {
        cardId: 'OP17-047',
        name: 'Shiki',
        quantity: 4,
        cost: 4,
        power: 5000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10062.jpg',
        yuyuPrice: 180,
        marketPrice: 1.25
      },
      {
        cardId: 'OP17-042',
        name: 'Kaido',
        quantity: 4,
        cost: 5,
        power: 6000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10057.jpg',
        yuyuPrice: 220,
        marketPrice: 1.55
      },
      {
        cardId: 'OP17-049',
        name: 'Charlotte Linlin',
        quantity: 4,
        cost: 6,
        power: 7000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10065.jpg',
        yuyuPrice: 250,
        marketPrice: 1.75
      },
      {
        cardId: 'OP17-040',
        name: 'Edward.Newgate',
        quantity: 4,
        cost: 7,
        power: 8000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10053.jpg',
        yuyuPrice: 320,
        marketPrice: 2.29
      },
      {
        cardId: 'OP17-118',
        name: 'Rocks.D.Xebec',
        quantity: 4,
        cost: 9,
        power: 11000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10074.jpg',
        yuyuPrice: 650,
        marketPrice: 4.6
      },
      {
        cardId: 'OP17-051',
        name: 'Jinbe',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10068.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-054',
        name: 'Miss Buckingham Stussy',
        quantity: 4,
        cost: 2,
        power: 1000,
        category: 'Character',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10072.jpg',
        yuyuPrice: 150,
        marketPrice: 1.05
      },
      {
        cardId: 'OP17-057',
        name: 'Fullalead',
        quantity: 4,
        cost: 2,
        power: null,
        category: 'Stage',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10075.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      },
      {
        cardId: 'OP17-056',
        name: 'Rocks Pirates',
        quantity: 4,
        cost: 1,
        power: null,
        category: 'Event',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10074.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-055',
        name: "There's No Authority in the World That Lasts Forever!!!",
        quantity: 2,
        cost: 2,
        power: null,
        category: 'Event',
        colors: 'Blue',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10073.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      }
    ],
    stats: {
      charactersCount: 40,
      eventsCount: 6,
      stagesCount: 4,
      counters2000: 12,
      counters1000: 24,
      noCounter: 14,
      avgCost: 3.8
    }
  },
  {
    id: 'green-shanks-op17',
    name: '(Green) Shanks',
    subname: 'Shanks',
    leaderId: 'OP17-020',
    leaderName: 'Shanks',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10024.jpg',
    color: 'Green',
    colorDot: '#16a34a',
    rank: '#5',
    winrate: '0%',
    date: '28/08/2026',
    tournament: 'Grand Asia Cup Top 8',
    source: 'OnePieceTopDecks',
    description: 'Green Red Hair Pirates rest-and-strike strategy with Benn Beckman snipes and Lucky Roux defensive resilience.',
    cards: [
      {
        cardId: 'OP17-021',
        name: 'Crone Oli',
        quantity: 4,
        cost: 1,
        power: 1000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10027.jpg',
        yuyuPrice: 50,
        marketPrice: 0.36
      },
      {
        cardId: 'OP17-034',
        name: 'Rockstar',
        quantity: 4,
        cost: 2,
        power: 3000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10043.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-029',
        name: 'Hongo',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10037.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      },
      {
        cardId: 'OP17-033',
        name: 'Lucky.Roux',
        quantity: 4,
        cost: 4,
        power: 5000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10042.jpg',
        yuyuPrice: 150,
        marketPrice: 1.05
      },
      {
        cardId: 'OP17-031',
        name: 'Yasopp',
        quantity: 4,
        cost: 5,
        power: 6000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10040.jpg',
        yuyuPrice: 180,
        marketPrice: 1.25
      },
      {
        cardId: 'OP17-027',
        name: 'Benn.Beckman',
        quantity: 4,
        cost: 7,
        power: 8000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10035.jpg',
        yuyuPrice: 380,
        marketPrice: 2.7
      },
      {
        cardId: 'OP17-022',
        name: 'Shanks',
        quantity: 4,
        cost: 9,
        power: 10000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10028.jpg',
        yuyuPrice: 520,
        marketPrice: 3.7
      },
      {
        cardId: 'OP17-023',
        name: 'Nami',
        quantity: 4,
        cost: 2,
        power: 2000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10029.jpg',
        yuyuPrice: 200,
        marketPrice: 1.42
      },
      {
        cardId: 'OP17-030',
        name: 'Monkey.D.Luffy',
        quantity: 4,
        cost: 4,
        power: 5000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10038.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-035',
        name: 'Roronoa Zoro',
        quantity: 4,
        cost: 5,
        power: 6000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10044.jpg',
        yuyuPrice: 220,
        marketPrice: 1.55
      },
      {
        cardId: 'OP17-025',
        name: 'Building Snake',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10032.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-036',
        name: 'Withdraw Now and Allow Me to Save Face',
        quantity: 4,
        cost: 1,
        power: null,
        category: 'Event',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10046.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      },
      {
        cardId: 'OP17-037',
        name: 'Are You That Afraid of the New Era?!!',
        quantity: 2,
        cost: 2,
        power: null,
        category: 'Event',
        colors: 'Green',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10047.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      }
    ],
    stats: {
      charactersCount: 44,
      eventsCount: 6,
      stagesCount: 0,
      counters2000: 12,
      counters1000: 24,
      noCounter: 14,
      avgCost: 3.6
    }
  },
  {
    id: 'red-edward-newgate-op17',
    name: '(Red) Edward.Newgate',
    subname: 'Edward.Newgate',
    leaderId: 'OP17-001',
    leaderName: 'Edward.Newgate',
    leaderImage: 'https://card.yuyu-tei.jp/opc/front/op17/10001.jpg',
    color: 'Red',
    colorDot: '#dc2626',
    rank: '#6',
    winrate: '0%',
    date: '28/08/2026',
    tournament: 'Emperor Cup Tokyo Champion',
    source: 'OnePieceTopDecks',
    description: 'Heavy 6000 base power Whitebeard Pirates rush engine with Marco revives and Ace offensive surges.',
    cards: [
      {
        cardId: 'OP17-003',
        name: 'Izo',
        quantity: 4,
        cost: 1,
        power: 2000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10005.jpg',
        yuyuPrice: 150,
        marketPrice: 1.05
      },
      {
        cardId: 'OP17-011',
        name: 'Blamenco',
        quantity: 4,
        cost: 2,
        power: 3000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10013.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-008',
        name: 'Jozu',
        quantity: 4,
        cost: 4,
        power: 4000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10010.jpg',
        yuyuPrice: 180,
        marketPrice: 1.25
      },
      {
        cardId: 'OP17-015',
        name: 'Marco',
        quantity: 4,
        cost: 5,
        power: 6000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10018.jpg',
        yuyuPrice: 350,
        marketPrice: 2.5
      },
      {
        cardId: 'OP17-013',
        name: 'Portgas.D.Ace',
        quantity: 4,
        cost: 7,
        power: 7000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10015.jpg',
        yuyuPrice: 380,
        marketPrice: 2.7
      },
      {
        cardId: 'OP17-005',
        name: 'Edward.Newgate',
        quantity: 4,
        cost: 9,
        power: 10000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10007.jpg',
        yuyuPrice: 480,
        marketPrice: 3.4
      },
      {
        cardId: 'OP17-009',
        name: 'Haruta',
        quantity: 4,
        cost: 2,
        power: 3000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10011.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-010',
        name: 'Fossa',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10012.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-006',
        name: 'Kingdew',
        quantity: 4,
        cost: 4,
        power: 5000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10008.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      },
      {
        cardId: 'OP17-016',
        name: 'Rakuyo',
        quantity: 4,
        cost: 3,
        power: 4000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10019.jpg',
        yuyuPrice: 80,
        marketPrice: 0.57
      },
      {
        cardId: 'OP17-014',
        name: 'Whitey Bay',
        quantity: 4,
        cost: 1,
        power: 2000,
        category: 'Character',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10016.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      },
      {
        cardId: 'OP17-017',
        name: 'Ga Ha Ha Ha!!',
        quantity: 4,
        cost: 1,
        power: null,
        category: 'Event',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10020.jpg',
        yuyuPrice: 100,
        marketPrice: 0.71
      },
      {
        cardId: 'OP17-018',
        name: 'The Power to Destroy the World',
        quantity: 2,
        cost: 2,
        power: null,
        category: 'Event',
        colors: 'Red',
        imageUrl: 'https://card.yuyu-tei.jp/opc/front/op17/10021.jpg',
        yuyuPrice: 120,
        marketPrice: 0.86
      }
    ],
    stats: {
      charactersCount: 44,
      eventsCount: 6,
      stagesCount: 0,
      counters2000: 12,
      counters1000: 24,
      noCounter: 14,
      avgCost: 3.5
    }
  }
];

export function getDeckById(id: string): RecommendedDeck | undefined {
  return RECOMMENDED_DECKS.find((d) => d.id === id || d.leaderId.toLowerCase() === id.toLowerCase());
}

export function formatDeckExport(deck: RecommendedDeck): string {
  const lines: string[] = [];
  lines.push(`// Leader: ${deck.leaderName} (${deck.leaderId})`);
  lines.push(`1x${deck.leaderId}`);
  for (const c of deck.cards) {
    lines.push(`${c.quantity}x${c.cardId}`);
  }
  return lines.join('\n');
}
