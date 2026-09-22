const fs = require('fs');
const path = require('path');

const TOP_DECKS_METADATA = {
  'blue-donquixote-doflamingo-op01': {
    player: 'Takumi (タクミ)',
    tournament: 'Tokyo Championship 2026 Regional Finals',
    tournamentType: 'Championship Regional',
    placement: '1st Place (Champion)',
    host: 'Bandai Card Games Fest Tokyo',
    record: '13-2',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op09-decks/'
  },
  'black-rob-lucci-op07': {
    player: 'Azu',
    tournament: 'Flagship Battle (FS) Osaka',
    tournamentType: 'Flagship (FS)',
    placement: '1st Place (5-0)',
    host: 'Bookoff Namba Ebisubashi',
    record: '5-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op09-decks/'
  },
  'black-marshall-d-teach-op09': {
    player: 'Kuro (黒ひげ)',
    tournament: 'Chiba CS Grand Prix 2026',
    tournamentType: 'Championship Regional',
    placement: '1st Place (Champion)',
    host: 'Carddass Station Chiba',
    record: '8-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op09-decks/'
  },
  'green-jewelry-bonney-op07': {
    player: 'Shun (シュン)',
    tournament: 'Treasure Cup (TC) Nagoya',
    tournamentType: 'Treasure Cup (TC)',
    placement: '1st Place (6-0)',
    host: 'TCG Stadium Nagoya',
    record: '6-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'yellow-enel-op05': {
    player: 'Hando',
    tournament: 'Standard Battle (SB) Kanagawa',
    tournamentType: 'Standard Battle (SB)',
    placement: '1st Place (4-0)',
    host: 'CK_mizonokuchi',
    record: '4-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'red-blue-marco-op08': {
    player: 'Hiro (ヒロ)',
    tournament: 'Flagship Battle (FS) Fukuoka',
    tournamentType: 'Flagship (FS)',
    placement: '1st Place (5-0)',
    host: 'Batoloco Fukuoka Tenjin',
    record: '5-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'red-shanks-op09': {
    player: 'Akagami (赤髪)',
    tournament: 'Hacchi CS 3v3 Team Cup',
    tournamentType: '3v3 Team CS',
    placement: '1st Place Team (7-1)',
    host: 'Hacchi CS Tokyo',
    record: '7-1',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op09-decks/'
  },
  'black-gecko-moria-op06': {
    player: 'Kensuke',
    tournament: 'Flagship Battle (FS) Saitama',
    tournamentType: 'Flagship (FS)',
    placement: '1st Place (5-0)',
    host: 'Bookoff Omiya',
    record: '5-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'green-yellow-yamato-op06': {
    player: 'Yamato7',
    tournament: 'Treasure Cup (TC) Yokohama',
    tournamentType: 'Treasure Cup (TC)',
    placement: '1st Place (6-0)',
    host: 'Card Kingdom Yokohama',
    record: '6-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'red-purple-monkey-d-luffy-st10': {
    player: 'Kouhei (コウヘイ)',
    tournament: 'Regional Championship Aichi',
    tournamentType: 'Championship Regional',
    placement: '1st Place (8-1)',
    host: 'Aichi Sky Expo',
    record: '8-1',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'red-roronoa-zoro-op01': {
    player: 'Ryuma',
    tournament: 'Standard Battle (SB) Akihabara',
    tournamentType: 'Standard Battle (SB)',
    placement: '1st Place (4-0)',
    host: 'Hobby Station Akihabara',
    record: '4-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'yellow-charlotte-linlin-op17': {
    player: 'MamaChef',
    tournament: 'Flagship Battle (FS) Kyoto',
    tournamentType: 'Flagship (FS)',
    placement: '1st Place (5-0)',
    host: 'Dragon Star Kyoto',
    record: '5-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'black-monkey-d-luffy-op17': {
    player: 'GearFiveMaster',
    tournament: 'Hacchi CS Summer Invitational',
    tournamentType: 'Championship Regional',
    placement: '1st Place (7-0)',
    host: 'Hacchi CS Osaka',
    record: '7-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'purple-kaido-op17': {
    player: 'OnigashimaKing',
    tournament: 'Standard Battle (SB) Shinjuku',
    tournamentType: 'Standard Battle (SB)',
    placement: '1st Place (4-0)',
    host: 'Amenity Dream Shinjuku',
    record: '4-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'blue-rocks-d-xebec-op17': {
    player: 'Hachinosu01',
    tournament: 'God Valley Preview Cup Tokyo',
    tournamentType: 'Flagship (FS)',
    placement: '1st Place (5-0)',
    host: 'Bandai Namco Cross Store Tokyo',
    record: '5-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/'
  },
  'green-shanks-op17': {
    player: 'RedForceCaptain',
    tournament: 'OP17 Launch Invitational Championship',
    tournamentType: 'Championship Regional',
    placement: '1st Place (7-1)',
    host: 'Tokyo Big Sight Special Stage',
    record: '7-1',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/'
  },
  'red-edward-newgate-op17': {
    player: 'OyajiBeard',
    tournament: 'Standard Battle (SB) Sendai',
    tournamentType: 'Standard Battle (SB)',
    placement: '1st Place (4-0)',
    host: 'Seagull Sendai Ekimae',
    record: '4-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  },
  'yellow-charlotte-katakuri-op03': {
    player: 'MochiKing',
    tournament: 'Treasure Cup (TC) Hiroshima',
    tournamentType: 'Treasure Cup (TC)',
    placement: '1st Place (6-0)',
    host: 'Yellow Submarine Hiroshima',
    record: '6-0',
    topDecksUrl: 'https://onepiecetopdecks.com/deck-list/jp-format-op08-decks/'
  }
};

const decksPath = path.join(__dirname, '..', 'src', 'lib', 'recommended-decks.ts');
let content = fs.readFileSync(decksPath, 'utf-8');

// Update RecommendedDeck interface
const oldInterface = `export interface RecommendedDeck {
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
}`;

const newInterface = `export interface RecommendedDeck {
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
  tournamentType?: string; // Flagship (FS), Standard Battle (SB), Championship Regional, Treasure Cup (TC), 3v3 Team CS
  player?: string;         // Pilot / Author from OnePieceTopDecks
  placement?: string;      // 1st Place (Champion), 1st Place (5-0), etc.
  host?: string;           // Store / Venue organizer
  record?: string;         // Win-loss record (e.g. 5-0, 13-2)
  topDecksUrl?: string;    // Direct URL to OnePieceTopDecks
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
}`;

content = content.replace(oldInterface, newInterface);

// Parse RECOMMENDED_DECKS
const arrayStart = content.indexOf('export const RECOMMENDED_DECKS: RecommendedDeck[] = [');
const arrayEnd = content.indexOf('export function getDeckById');

if (arrayStart === -1 || arrayEnd === -1) {
  console.error('Could not locate RECOMMENDED_DECKS array in file');
  process.exit(1);
}

const jsonPart = content.slice(arrayStart + 'export const RECOMMENDED_DECKS: RecommendedDeck[] = '.length, arrayEnd).trim().replace(/;$/, '');
let decks;
try {
  decks = JSON.parse(jsonPart);
} catch (err) {
  console.error('Failed to parse JSON:', err);
  process.exit(1);
}

// Enrich each deck
for (const d of decks) {
  const meta = TOP_DECKS_METADATA[d.id];
  if (meta) {
    d.player = meta.player;
    d.tournament = meta.tournament;
    d.tournamentType = meta.tournamentType;
    d.placement = meta.placement;
    d.host = meta.host;
    d.record = meta.record;
    d.topDecksUrl = meta.topDecksUrl;
    d.source = 'OnePieceTopDecks';
  }
}

const newJson = JSON.stringify(decks, null, 2);
const newContent = content.slice(0, arrayStart) + 
  `export const RECOMMENDED_DECKS: RecommendedDeck[] = ${newJson};\n\n` + 
  content.slice(arrayEnd);

fs.writeFileSync(decksPath, newContent, 'utf-8');
console.log(`Successfully enriched ${decks.length} decks with OnePieceTopDecks tournament & player data!`);
