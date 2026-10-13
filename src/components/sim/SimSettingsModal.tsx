'use client';

import React, { useState } from 'react';
import { OPTCG_TUTORIAL_STEPS } from '@/lib/sim/tutorial-data';
import { RECOMMENDED_DECKS, RecommendedDeck } from '@/lib/recommended-decks';
import { ST01_STRAW_HAT_DECK, ST04_ANIMAL_KINGDOM_DECK } from '@/lib/sim/starter-decks';
import {
  X,
  GraduationCap,
  RotateCcw,
  Swords,
  BookOpen,
  Sparkles,
  Layers,
  Users,
  Check,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';

import { AnimationSpeed } from '@/lib/sim/sim-animations';

interface SimSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorialMode: boolean;
  onToggleTutorial: (enabled: boolean) => void;
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  onResetTutorial: () => void;
  onSelectPlayerDeck?: (deck: RecommendedDeck) => void;
  onSelectOpponentDeck?: (deck: RecommendedDeck) => void;
  currentOpponentDeckId?: string;
  animationSpeed?: AnimationSpeed;
  onSetAnimationSpeed?: (speed: AnimationSpeed) => void;
}

export function SimSettingsModal({
  isOpen,
  onClose,
  tutorialMode,
  onToggleTutorial,
  currentStepIndex,
  onSelectStep,
  onResetTutorial,
  onSelectPlayerDeck,
  onSelectOpponentDeck,
  currentOpponentDeckId,
  animationSpeed = 'normal',
  onSetAnimationSpeed,
}: SimSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'tutorial' | 'gameplay' | 'matchup' | 'rules'>('gameplay');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#101624] border border-[#232f48] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-gray-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#151e32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
              ⚙
            </div>
            <div>
              <h3 className="text-base font-black text-white">Simulator & Gameplay Settings</h3>
              <p className="text-[11px] text-gray-400">One Piece Card Game Official Engine</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#0d1320] px-4 pt-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('gameplay')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'gameplay'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Speed & FX</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'tutorial'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Interactive Tutorial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matchup')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'matchup'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Deck & Opponent</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ===================================================================
              TAB 0: GAMEPLAY & ANIMATION SPEED SETTINGS
             =================================================================== */}
          {activeTab === 'gameplay' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gameplay & Animation Speed</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Control card movement, combat slashes, and AI opponent pacing.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Normal Speed */}
                  <button
                    type="button"
                    onClick={() => onSetAnimationSpeed && onSetAnimationSpeed('normal')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer ${
                      animationSpeed === 'normal'
                        ? 'border-amber-400 bg-amber-400/15 text-white ring-2 ring-amber-400/40 shadow-lg'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="text-base font-black">⚡ Normal</span>
                    <span className="text-[10px] text-gray-300 font-mono">1.0x (Default)</span>
                    <span className="text-[9px] text-gray-400 leading-tight">
                      Full animations, card flights & readable pacing
                    </span>
                  </button>

                  {/* Fast Speed */}
                  <button
                    type="button"
                    onClick={() => onSetAnimationSpeed && onSetAnimationSpeed('fast')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer ${
                      animationSpeed === 'fast'
                        ? 'border-cyan-400 bg-cyan-400/15 text-white ring-2 ring-cyan-400/40 shadow-lg'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="text-base font-black">⏩ Fast</span>
                    <span className="text-[10px] text-gray-300 font-mono">2.0x</span>
                    <span className="text-[9px] text-gray-400 leading-tight">
                      Shortened 50% transitions for quick matches
                    </span>
                  </button>

                  {/* Instant Speed */}
                  <button
                    type="button"
                    onClick={() => onSetAnimationSpeed && onSetAnimationSpeed('instant')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer ${
                      animationSpeed === 'instant'
                        ? 'border-emerald-400 bg-emerald-400/15 text-white ring-2 ring-emerald-400/40 shadow-lg'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="text-base font-black">⏭️ Instant</span>
                    <span className="text-[10px] text-gray-300 font-mono">0ms Delay</span>
                    <span className="text-[9px] text-gray-400 leading-tight">
                      Instant state updates, zero waiting
                    </span>
                  </button>
                </div>
              </div>

              {/* Interaction Features Overview */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Interaction Guarantees</span>
                </h4>
                <ul className="list-disc list-inside text-[11px] text-gray-400 space-y-1">
                  <li>
                    <strong>Player Defense Windows:</strong> Opponent attacks always pause so you can choose to Block, Counter, or take damage.
                  </li>
                  <li>
                    <strong>Input Protection:</strong> Double-clicking or rapid taps while a card is animating will not cause duplicate card plays or invalid state glitches.
                  </li>
                  <li>
                    <strong>Reduced Motion Support:</strong> Respects system accessibility preferences automatically.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 1: TUTORIAL SETTINGS
             =================================================================== */}
          {activeTab === 'tutorial' && (
            <div className="space-y-4">
              {/* Toggle Tutorial Mode */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tutorial Guidance Overlay</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Show top goal prompts, step drawers, and highlighted zones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleTutorial(!tutorialMode)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    tutorialMode ? 'bg-cyan-500' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      tutorialMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Reset to Tutorial Match button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetTutorial();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart ST-01 vs ST-04 Tutorial Match</span>
                </button>
              </div>

              {/* Lesson Chapters Selector */}
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                  Jump to Tutorial Lesson
                </h4>
                <div className="space-y-1.5">
                  {OPTCG_TUTORIAL_STEPS.map((step, idx) => (
                    <div
                      key={step.id}
                      onClick={() => {
                        onSelectStep(idx);
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        currentStepIndex === idx && tutorialMode
                          ? 'bg-cyan-950/60 border-cyan-400/50 text-white shadow-md'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {step.id}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold truncate text-white">{step.title}</h5>
                          <p className="text-[10px] text-gray-400 truncate">{step.subtitle}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 2: DECK & OPPONENT MATCHUP
             =================================================================== */}
          {activeTab === 'matchup' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2">
                  Recommended Starter Matchup
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30">
                    <span className="text-[10px] font-bold text-red-400 uppercase">Player</span>
                    <h5 className="font-bold text-xs text-white mt-0.5">ST-01 Straw Hat Crew</h5>
                    <p className="text-[10px] text-gray-400">Monkey D. Luffy (Red)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
                    <span className="text-[10px] font-bold text-purple-400 uppercase">Opponent</span>
                    <h5 className="font-bold text-xs text-white mt-0.5">ST-04 Animal Kingdom</h5>
                    <p className="text-[10px] text-gray-400">Kaido (Purple)</p>
                  </div>
                </div>
              </div>

              {onSelectOpponentDeck && (
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                    Switch Opponent Deck
                  </h4>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {[ST04_ANIMAL_KINGDOM_DECK, ...RECOMMENDED_DECKS.slice(0, 10)].map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          onSelectOpponentDeck(d);
                          onClose();
                        }}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          currentOpponentDeckId === d.id
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 aspect-[2.5/3.5] rounded overflow-hidden bg-black/40 border border-white/10 shrink-0">
                            <img src={d.leaderImage} alt={d.leaderName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-white">{d.name}</h5>
                            <span className="text-[10px] text-gray-400">{d.leaderName}</span>
                          </div>
                        </div>
                        {currentOpponentDeckId === d.id && (
                          <Check className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB 3: OFFICIAL RULES CHEAT SHEET
             =================================================================== */}
          {activeTab === 'rules' && (
            <div className="space-y-3 text-xs leading-relaxed text-gray-300">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="text-amber-400">1.</span> Turn Sequence
                </h4>
                <ul className="list-disc list-inside text-[11px] text-gray-400 space-y-1">
                  <li><strong>Refresh Phase:</strong> Untap all rested cards and return all attached DON!! cards to the Cost Area.</li>
                  <li><strong>Draw Phase:</strong> Draw 1 card from your Deck (Player 1 skips on Turn 1).</li>
                  <li><strong>DON!! Phase:</strong> Place 2 DON!! cards into Cost Area as Active (Player 1 gets 1 on Turn 1).</li>
                  <li><strong>Main Phase:</strong> Play cards, attach DON!!, and declare attacks in any order.</li>
                  <li><strong>End Phase:</strong> Buffs wear off, turn passes to opponent.</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="text-amber-400">2.</span> Combat & Defense
                </h4>
                <ul className="list-disc list-inside text-[11px] text-gray-400 space-y-1">
                  <li>Attacker rests and declares target: Opponent Leader OR Rested Character.</li>
                  <li>Defender can activate <strong>[Blocker]</strong> by resting an active Blocker character.</li>
                  <li>Defender can discard <strong>[Counter]</strong> cards (+1000/+2000) from hand.</li>
                  <li>If Attacker Power &ge; Defender Power, target takes damage or is K.O.'d.</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="text-amber-400">3.</span> Life & Win Conditions
                </h4>
                <ul className="list-disc list-inside text-[11px] text-gray-400 space-y-1">
                  <li>When a Leader takes damage, 1 Life card is taken into hand.</li>
                  <li>If the card has a <strong>[Trigger]</strong>, it can be activated immediately for free!</li>
                  <li>When an opponent has 0 Life, landing one final direct attack wins the game!</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-white/10 bg-[#151e32] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
