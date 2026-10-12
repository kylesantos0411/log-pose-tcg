/**
 * sim-types.ts
 * Type definitions for the One Piece TCG Simulator engine.
 * Supports full Bandai tournament rules, automated AI opponent, and interactive tutorial mode.
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
  hasBlocker?: boolean;
  hasRush?: boolean;
  canAttackThisTurn?: boolean;
}

export type GamePhase = 'REFRESH' | 'DRAW' | 'DON' | 'MAIN' | 'END';

export interface GameLogEntry {
  id: string;
  time: string;
  text: string;
  type: 'action' | 'phase' | 'combat' | 'system';
}

export interface SimOpponent {
  deckId: string;
  name: string;
  leaderId: string;
  leaderName: string;
  leaderImage: string;
  leaderPower: number;
  life: number;
  maxLife: number;
  attachedDon: number;
  rested: boolean;
  activeDon: number;
  restedDon: number;
  donDeckCount: number;
  handCount: number;
  deckCount: number;
  characters: SimCard[];
  trashCount: number;
  deckCards?: SimCard[];
  handCards?: SimCard[];
}

export interface PendingCombat {
  attackerInstanceId: string;
  attackerName: string;
  attackerPower: number;
  attackerIsPlayer: boolean;
  targetType: 'leader' | 'character';
  targetInstanceId?: string;
  targetName: string;
  targetPower: number;
  currentBoost: number;
  canBlock: boolean;
  canCounter: boolean;
  blockerCards?: SimCard[];
  counterCards?: SimCard[];
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
  opponent: SimOpponent;
  opponentLife: number; // Legacy compatibility
  opponentPower: number; // Legacy compatibility
  logs: GameLogEntry[];
  tutorialMode: boolean;
  tutorialStepIndex: number;
  pendingCombat: PendingCombat | null;
  winner: 'player' | 'opponent' | null;
  isOpponentTurn: boolean;
}
