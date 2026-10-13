'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SimCard, SimGameState } from '@/lib/sim/sim-types';

export interface PlayerPublicBoard {
  playerId: string;
  deckName: string;
  leader: SimCard;
  characters: SimCard[];
  stage: SimCard | null;
  activeDon: number;
  restedDon: number;
  attachedDon: number;
  donDeckCount: number;
  handCount: number;
  lifeCount: number;
  deckCount: number;
  trashCount: number;
  trash: SimCard[];
}

export interface PlayerHandshakePayload {
  playerId: string;
  isHost: boolean;
  deckName: string;
  leader: SimCard;
  deckCount: number;
  lifeCount: number;
  handCount: number;
  activeDon: number;
  isReply?: boolean;
}

export interface AttackDeclaredPayload {
  playerId: string;
  attackerId: string;
  attackerName: string;
  attackerImageUrl?: string;
  attackerPower: number;
  targetType: 'leader' | 'character';
  targetCharId?: string;
  targetName: string;
  targetPower: number;
}

export interface BlockerActivatedPayload {
  playerId: string;
  blockerId: string;
  blockerName: string;
  blockerPower: number;
}

export interface CounterPlayedPayload {
  playerId: string;
  counterBoost: number;
  cardName: string;
}

export interface CombatResolvedPayload {
  playerId: string;
  outcome: 'hit' | 'repelled';
  targetHitName: string;
  damageTaken: boolean;
  lifeRemaining: number;
  koCharId?: string;
  isFatal?: boolean;
}

export interface TurnEndPayload {
  playerId: string;
  nextTurnNumber: number;
}

export interface SimMultiplayerCallbacks {
  onHandshake?: (payload: PlayerHandshakePayload) => void;
  onBoardSync?: (board: PlayerPublicBoard) => void;
  onAttackDeclared?: (payload: AttackDeclaredPayload) => void;
  onBlockerActivated?: (payload: BlockerActivatedPayload) => void;
  onCounterPlayed?: (payload: CounterPlayedPayload) => void;
  onCombatResolved?: (payload: CombatResolvedPayload) => void;
  onTurnEnd?: (payload: TurnEndPayload) => void;
  onPlayerJoined?: (playerId: string) => void;
  onPlayerLeft?: (playerId: string) => void;
  onEmote?: (text: string) => void;
  onStateSync?: (state: SimGameState) => void;
}

export interface MultiplayerRoomState {
  roomId: string;
  hostId: string;
  guestId?: string;
  hostDeckName: string;
  guestDeckName?: string;
  status: 'waiting' | 'in_progress' | 'ended';
  gameState?: SimGameState;
  lastAction?: {
    playerId: string;
    description: string;
    timestamp: number;
  };
}

/**
 * Manage Realtime 2-Player Match Room via Supabase Broadcast channels
 */
export class SimMultiplayerEngine {
  private channel: any = null;
  private roomId: string | null = null;
  private playerId: string;

  constructor() {
    this.playerId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('optcg_sim_peer_id') || `p-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`)
      : 'player-default';
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('optcg_sim_peer_id', this.playerId);
    }
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  /**
   * Connect to a game room channel
   */
  public joinRoom(
    roomId: string,
    callbacksOrLegacySync: SimMultiplayerCallbacks | ((state: SimGameState) => void),
    onPlayerJoinedLegacy?: (playerId: string) => void,
    onActionBroadcastLegacy?: (action: any) => void
  ) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;

    // Clean up previous room if any
    this.leaveRoom();

    this.roomId = roomId;
    const channelName = `sim-room-${roomId}`;
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    const callbacks: SimMultiplayerCallbacks =
      typeof callbacksOrLegacySync === 'function'
        ? {
            onStateSync: callbacksOrLegacySync,
            onPlayerJoined: onPlayerJoinedLegacy,
          }
        : callbacksOrLegacySync;

    // Register event listeners (strictly filter out own broadcasts to avoid echo loops)
    this.channel
      .on('broadcast', { event: 'player_joined' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onPlayerJoined) {
          callbacks.onPlayerJoined(payload.playerId);
        }
      })
      .on('broadcast', { event: 'player_handshake' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onHandshake) {
          callbacks.onHandshake(payload);
        }
      })
      .on('broadcast', { event: 'board_sync' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onBoardSync && payload?.board) {
          callbacks.onBoardSync(payload.board);
        }
      })
      .on('broadcast', { event: 'attack_declared' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onAttackDeclared) {
          callbacks.onAttackDeclared(payload);
        }
      })
      .on('broadcast', { event: 'blocker_activated' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onBlockerActivated) {
          callbacks.onBlockerActivated(payload);
        }
      })
      .on('broadcast', { event: 'counter_played' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onCounterPlayed) {
          callbacks.onCounterPlayed(payload);
        }
      })
      .on('broadcast', { event: 'combat_resolved' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onCombatResolved) {
          callbacks.onCombatResolved(payload);
        }
      })
      .on('broadcast', { event: 'turn_end' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onTurnEnd) {
          callbacks.onTurnEnd(payload);
        }
      })
      .on('broadcast', { event: 'emote' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onEmote && payload?.text) {
          callbacks.onEmote(payload.text);
        }
      })
      .on('broadcast', { event: 'game_state_sync' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (callbacks.onStateSync && payload?.gameState) {
          callbacks.onStateSync(payload.gameState);
        }
      })
      .on('broadcast', { event: 'game_action' }, ({ payload }: any) => {
        if (!payload?.playerId || payload.playerId === this.playerId) return;
        if (onActionBroadcastLegacy) {
          onActionBroadcastLegacy(payload);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.channel?.send({
            type: 'broadcast',
            event: 'player_joined',
            payload: { playerId: this.playerId },
          });
        }
      });

    return this.channel;
  }

  /**
   * Broadcast handshake with player leader and starting cards
   */
  public broadcastHandshake(payload: Omit<PlayerHandshakePayload, 'playerId'>) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'player_handshake',
      payload: {
        playerId: this.playerId,
        ...payload,
      },
    });
  }

  /**
   * Broadcast public board state (characters, leader, active DON, hand count, etc.)
   */
  public broadcastBoardSync(board: PlayerPublicBoard) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'board_sync',
      payload: {
        playerId: this.playerId,
        board,
      },
    });
  }

  /**
   * Broadcast attack declaration
   */
  public broadcastAttackDeclared(payload: Omit<AttackDeclaredPayload, 'playerId'>) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'attack_declared',
      payload: {
        playerId: this.playerId,
        ...payload,
      },
    });
  }

  /**
   * Broadcast Blocker intercept
   */
  public broadcastBlockerActivated(payload: Omit<BlockerActivatedPayload, 'playerId'>) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'blocker_activated',
      payload: {
        playerId: this.playerId,
        ...payload,
      },
    });
  }

  /**
   * Broadcast Counter from hand
   */
  public broadcastCounterPlayed(payload: Omit<CounterPlayedPayload, 'playerId'>) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'counter_played',
      payload: {
        playerId: this.playerId,
        ...payload,
      },
    });
  }

  /**
   * Broadcast Combat resolution outcome
   */
  public broadcastCombatResolved(payload: Omit<CombatResolvedPayload, 'playerId'>) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'combat_resolved',
      payload: {
        playerId: this.playerId,
        ...payload,
      },
    });
  }

  /**
   * Broadcast Turn End
   */
  public broadcastTurnEnd(nextTurnNumber: number) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'turn_end',
      payload: {
        playerId: this.playerId,
        nextTurnNumber,
      },
    });
  }

  /**
   * Broadcast Emote / Chat quick phrase
   */
  public broadcastEmote(text: string) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'emote',
      payload: {
        playerId: this.playerId,
        text,
      },
    });
  }

  /**
   * Broadcast raw state update (legacy)
   */
  public broadcastGameState(gameState: SimGameState) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'game_state_sync',
      payload: {
        playerId: this.playerId,
        gameState,
      },
    });
  }

  /**
   * Broadcast specific game action (legacy)
   */
  public broadcastAction(actionType: string, payload: any) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'game_action',
      payload: {
        playerId: this.playerId,
        actionType,
        ...payload,
      },
    });
  }

  /**
   * Leave room and clean up subscription
   */
  public leaveRoom() {
    if (this.channel) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        try {
          supabase.removeChannel(this.channel);
        } catch (e) {
          console.warn('Error removing multiplayer channel:', e);
        }
      }
      this.channel = null;
      this.roomId = null;
    }
  }
}

export const simMultiplayer = new SimMultiplayerEngine();
