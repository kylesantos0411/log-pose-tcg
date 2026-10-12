'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SimGameState } from '@/lib/sim/sim-types';

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

export type RoomEventCallback = (payload: any) => void;

/**
 * Manage Realtime 2-Player Match Room via Supabase Broadcast channels
 */
export class SimMultiplayerEngine {
  private channel: any = null;
  private roomId: string | null = null;
  private playerId: string;

  constructor() {
    this.playerId = typeof window !== 'undefined'
      ? (localStorage.getItem('optcg_player_id') || `p-${Math.random().toString(36).substring(2, 9)}`)
      : 'player-default';
    if (typeof window !== 'undefined') {
      localStorage.setItem('optcg_player_id', this.playerId);
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
    onStateSync: (state: SimGameState) => void,
    onPlayerJoined?: (playerId: string) => void,
    onActionBroadcast?: (action: any) => void
  ) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;

    this.roomId = roomId;
    const channelName = `sim-room-${roomId}`;
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    this.channel
      .on('broadcast', { event: 'game_state_sync' }, ({ payload }: any) => {
        if (payload?.gameState) {
          onStateSync(payload.gameState);
        }
      })
      .on('broadcast', { event: 'player_joined' }, ({ payload }: any) => {
        if (onPlayerJoined && payload?.playerId) {
          onPlayerJoined(payload.playerId);
        }
      })
      .on('broadcast', { event: 'game_action' }, ({ payload }: any) => {
        if (onActionBroadcast && payload) {
          onActionBroadcast(payload);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          // Announce arrival
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
   * Broadcast state update to opponent
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
   * Broadcast specific game action (e.g. attack, pass, blocker, trigger)
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
        supabase.removeChannel(this.channel);
      }
      this.channel = null;
      this.roomId = null;
    }
  }
}

export const simMultiplayer = new SimMultiplayerEngine();
