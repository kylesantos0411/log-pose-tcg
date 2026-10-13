/**
 * sim-animations.ts
 * Centralized, reusable animation and visual interaction system for One Piece TCG Simulator.
 * Separates pure gameplay state logic from visual presentation and orchestrates animations
 * across mobile phones, tablets, and desktop browsers.
 */

import { SimCard } from './sim-types';

export type AnimationSpeed = 'normal' | 'fast' | 'instant';

export interface FloatingCardAnim {
  id: string;
  cardImageUrl: string;
  cardName: string;
  sourceRect: { x: number; y: number; width?: number; height?: number };
  targetRect: { x: number; y: number; width?: number; height?: number };
  durationMs: number;
}

export interface AttackSlashAnim {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  attackerName: string;
  targetName: string;
  durationMs: number;
}

export interface DonFlyAnim {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  amount: number;
  durationMs: number;
}

export interface PowerFloatPopup {
  id: string;
  text: string;
  x: number; // percentage or viewport px
  y: number;
  color: 'amber' | 'emerald' | 'rose' | 'cyan' | 'purple';
}

export interface TurnBannerAnim {
  id: string;
  turnNumber: number;
  isPlayerTurn: boolean;
  playerName: string;
}

export interface CombatImpactAnim {
  id: string;
  x: number;
  y: number;
  type: 'hit' | 'guard' | 'ko' | 'life';
  text?: string;
}

/**
 * Storage key for user speed preference
 */
const ANIM_SPEED_STORAGE_KEY = 'optcg_sim_anim_speed';

/**
 * Retrieve saved animation speed from localStorage, defaulting to 'normal'
 */
export function getStoredAnimationSpeed(): AnimationSpeed {
  if (typeof window === 'undefined') return 'normal';
  try {
    const saved = localStorage.getItem(ANIM_SPEED_STORAGE_KEY);
    if (saved === 'normal' || saved === 'fast' || saved === 'instant') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'normal';
}

/**
 * Persist user speed preference
 */
export function setStoredAnimationSpeed(speed: AnimationSpeed): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANIM_SPEED_STORAGE_KEY, speed);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if the user system prefers reduced motion
 */
export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Compute the effective timing in ms for a given animation base duration
 */
export function getAnimationDuration(baseMs: number, speed: AnimationSpeed): number {
  if (isReducedMotionPreferred() || speed === 'instant') {
    return 0;
  }
  if (speed === 'fast') {
    return Math.round(baseMs * 0.45);
  }
  return baseMs;
}

/**
 * Asynchronously wait for a given duration in milliseconds.
 * Returns immediately if speed is 'instant' or 0ms.
 */
export async function waitAnimation(ms: number, speed: AnimationSpeed): Promise<void> {
  const effectiveMs = getAnimationDuration(ms, speed);
  if (effectiveMs <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, effectiveMs));
}
