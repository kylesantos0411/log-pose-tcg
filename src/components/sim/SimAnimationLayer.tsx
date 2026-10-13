'use client';

import React from 'react';
import {
  FloatingCardAnim,
  AttackSlashAnim,
  DonFlyAnim,
  PowerFloatPopup,
  TurnBannerAnim,
  CombatImpactAnim,
} from '@/lib/sim/sim-animations';
import { Swords, Shield, Trophy, Skull, RotateCcw, Home, Sparkles } from 'lucide-react';

interface SimAnimationLayerProps {
  turnBanner: TurnBannerAnim | null;
  flyingCard: FloatingCardAnim | null;
  attackSlash: AttackSlashAnim | null;
  donFly: DonFlyAnim | null;
  combatImpact: CombatImpactAnim | null;
  powerPopups: PowerFloatPopup[];
  victoryDefeat: {
    winner: 'player' | 'opponent';
    leaderName?: string;
    leaderImage?: string;
    turnsElapsed?: number;
    onRematch?: () => void;
    onExit?: () => void;
  } | null;
}

export function SimAnimationLayer({
  turnBanner,
  flyingCard,
  attackSlash,
  donFly,
  combatImpact,
  powerPopups,
  victoryDefeat,
}: SimAnimationLayerProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* 1. TURN TRANSITION BANNER */}
      {turnBanner && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center animate-turnBannerSlide pointer-events-none z-50">
          <div
            className={`w-full max-w-lg py-3 px-6 shadow-2xl backdrop-blur-md flex items-center justify-between border-y-2 ${
              turnBanner.isPlayerTurn
                ? 'bg-gradient-to-r from-emerald-950/90 via-emerald-800/95 to-emerald-950/90 border-emerald-400 text-emerald-100'
                : 'bg-gradient-to-r from-rose-950/90 via-rose-900/95 to-rose-950/90 border-rose-500 text-rose-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black tracking-widest uppercase">
                {turnBanner.isPlayerTurn ? '⚔️ YOUR TURN' : '🤖 OPPONENT TURN'}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-amber-300">
              <span>TURN {turnBanner.turnNumber}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. FLYING CARD ANIMATION (Card gliding smoothly across zones) */}
      {flyingCard && (
        <div
          className="absolute z-40 transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: `${flyingCard.sourceRect.x}px`,
            top: `${flyingCard.sourceRect.y}px`,
            width: `${flyingCard.sourceRect.width || 64}px`,
            height: `${flyingCard.sourceRect.height || 90}px`,
            transform: `translate3d(${flyingCard.targetRect.x - flyingCard.sourceRect.x}px, ${
              flyingCard.targetRect.y - flyingCard.sourceRect.y
            }px, 0) scale(1.05)`,
            transitionDuration: `${flyingCard.durationMs}ms`,
          }}
        >
          <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border-2 border-amber-400 ring-4 ring-amber-400/50 bg-black animate-pulse">
            <img
              src={flyingCard.cardImageUrl}
              alt={flyingCard.cardName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* 3. ATTACK SLASH BEAM & TARGETING LINE */}
      {attackSlash && (
        <div className="absolute inset-0 pointer-events-none z-45">
          {/* Dynamic Laser Strike Line */}
          <svg className="w-full h-full absolute inset-0">
            <line
              x1={`${attackSlash.startX}%`}
              y1={`${attackSlash.startY}%`}
              x2={`${attackSlash.targetX}%`}
              y2={`${attackSlash.targetY}%`}
              stroke="rgba(244, 63, 94, 0.9)"
              strokeWidth="4"
              strokeDasharray="8 4"
              className="animate-pulse"
            />
          </svg>

          {/* Slicing Blade Impact at Target */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-slashBeam"
            style={{
              left: `${attackSlash.targetX}%`,
              top: `${attackSlash.targetY}%`,
            }}
          >
            <div className="w-36 h-2 bg-gradient-to-r from-transparent via-rose-300 to-white shadow-[0_0_20px_rgba(244,63,94,1)] rounded-full" />
          </div>
        </div>
      )}

      {/* 4. DON!! ENERGY ORB FLYING TO TARGET */}
      {donFly && (
        <div
          className="absolute z-45 pointer-events-none transition-all ease-out"
          style={{
            left: `${donFly.startX}%`,
            top: `${donFly.startY}%`,
            transform: `translate3d(${donFly.targetX - donFly.startX}vw, ${
              donFly.targetY - donFly.startY
            }vh, 0)`,
            transitionDuration: `${donFly.durationMs}ms`,
          }}
        >
          <div className="px-2.5 py-1 rounded-full bg-amber-400 text-black font-black text-xs shadow-[0_0_20px_rgba(251,191,36,1)] flex items-center gap-1 animate-donOrbPulse">
            <span>🪙 +{donFly.amount * 1000}</span>
          </div>
        </div>
      )}

      {/* 5. COMBAT IMPACT BURST */}
      {combatImpact && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex flex-col items-center justify-center"
          style={{
            left: `${combatImpact.x}%`,
            top: `${combatImpact.y}%`,
          }}
        >
          <div
            className={`w-20 h-20 rounded-full border-4 animate-impactShockwave ${
              combatImpact.type === 'hit' || combatImpact.type === 'ko'
                ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.9)]'
                : 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_30px_rgba(34,211,238,0.9)]'
            }`}
          />
          {combatImpact.text && (
            <div
              className={`absolute px-3 py-1 rounded-full font-black text-sm tracking-wider shadow-2xl animate-floatNumberUp ${
                combatImpact.type === 'hit' || combatImpact.type === 'ko'
                  ? 'bg-rose-600 text-white border border-rose-300'
                  : 'bg-cyan-600 text-white border border-cyan-300'
              }`}
            >
              {combatImpact.text}
            </div>
          )}
        </div>
      )}

      {/* 6. FLOATING STAT POPUPS (+1000 ATK, GUARD, LIFE BREAK) */}
      {powerPopups.map((popup) => (
        <div
          key={popup.id}
          className="absolute -translate-x-1/2 pointer-events-none z-50 animate-floatNumberUp"
          style={{
            left: `${popup.x}%`,
            top: `${popup.y}%`,
          }}
        >
          <div
            className={`px-2.5 py-0.5 rounded-full font-black text-xs sm:text-sm shadow-xl border ${
              popup.color === 'amber'
                ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/40'
                : popup.color === 'emerald'
                ? 'bg-emerald-500 text-black border-emerald-300 shadow-emerald-500/40'
                : popup.color === 'rose'
                ? 'bg-rose-600 text-white border-rose-300 shadow-rose-600/40'
                : popup.color === 'cyan'
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-cyan-500/40'
                : 'bg-purple-600 text-white border-purple-300 shadow-purple-600/40'
            }`}
          >
            {popup.text}
          </div>
        </div>
      ))}

      {/* 7. CINEMATIC VICTORY / DEFEAT MODAL */}
      {victoryDefeat && (
        <div className="pointer-events-auto fixed inset-0 z-55 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 text-center border-2 shadow-2xl flex flex-col items-center gap-4 ${
              victoryDefeat.winner === 'player'
                ? 'bg-gradient-to-b from-[#092215] via-[#05110d] to-[#040c09] border-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.5)]'
                : 'bg-gradient-to-b from-[#290a12] via-[#140509] to-[#0c0305] border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.5)]'
            }`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2 shadow-xl ${
                victoryDefeat.winner === 'player'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500'
              }`}
            >
              {victoryDefeat.winner === 'player' ? (
                <Trophy className="w-10 h-10 text-amber-300 animate-bounce" />
              ) : (
                <Skull className="w-10 h-10 text-rose-400 animate-pulse" />
              )}
            </div>

            <div>
              <h2
                className={`text-2xl sm:text-3xl font-black tracking-wider uppercase ${
                  victoryDefeat.winner === 'player' ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                {victoryDefeat.winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              <p className="text-xs text-gray-300 mt-1">
                {victoryDefeat.winner === 'player'
                  ? 'Congratulations! You eliminated the opponent Leader!'
                  : 'Your Leader took fatal damage. Better luck next match!'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full mt-2">
              {victoryDefeat.onRematch && (
                <button
                  type="button"
                  onClick={victoryDefeat.onRematch}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
              )}
              {victoryDefeat.onExit && (
                <button
                  type="button"
                  onClick={victoryDefeat.onExit}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Exit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
