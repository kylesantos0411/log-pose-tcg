/**
 * sim-types.ts
 * Type definitions for the One Piece TCG Simulator engine.
 */

export type CardCategory = 'Leader' | 'Character' | 'Event' | 'Stage';

export interface SimCard {
  instanceId: string;
  cardId: string;
  name: string;
  category: CardCategory;
  colors: string[];
  cost: number;
  power: number;
  counter: number | null;
  imageUrl: string;
  effect?: string | null;
  trigger?: string | null;
  types?: string | null;
  attributes?: string | null;
  rested: boolean;
  attachedDon: number;
  customPowerModifier: number;
}

export type GamePhase = 'REFRESH' | 'DRAW' | 'DON' | 'MAIN' | 'END';

export interface GameLogEntry {
  id: string;
  time: string;
  text: string;
  type: 'action' | 'phase' | 'combat' | 'system';
}

export interface SimGameState {
  leader: SimCard | null;
  deck: SimCard[];
  hand: SimCard[];
  characters: SimCard[]; // Max 5 character slots
  stage: SimCard | null;
  life: SimCard[];
  trash: SimCard[];
  donDeckCount: number; // 10 initial DON!! cards
  activeDon: number;
  restedDon: number;
  turn: number;
  goingFirst: boolean;
  phase: GamePhase;
  hasMulliganed: boolean;
  mulliganOffered: boolean;
  opponentLife: number; // Dummy practice target
  opponentPower: number;
  logs: GameLogEntry[];
}
