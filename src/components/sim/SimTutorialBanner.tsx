'use client';

import React, { useState, useEffect } from 'react';
import { OPTCG_TUTORIAL_STEPS, TutorialStep } from '@/lib/sim/tutorial-data';
import {
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';

interface SimTutorialBannerProps {
  currentStepIndex: number;
  onSetStep: (index: number) => void;
  onCloseTutorial: () => void;
  onOpenSettings: () => void;
  targetHighlight?: 'leader' | 'characters' | 'hand' | 'costArea' | 'donDeck' | 'life' | 'opponent' | 'endTurn' | 'none';
}

export function SimTutorialBanner({
  currentStepIndex,
  onSetStep,
  onCloseTutorial,
  onOpenSettings,
  targetHighlight = 'leader',
}: SimTutorialBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [manualPosition, setManualPosition] = useState<'top' | 'bottom' | null>(null);

  const step: TutorialStep = OPTCG_TUTORIAL_STEPS[currentStepIndex] || OPTCG_TUTORIAL_STEPS[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex >= OPTCG_TUTORIAL_STEPS.length - 1;

  // Determine smart automatic position:
  // If target to emphasize is on TOP (opponent), overlay at the BOTTOM (covering lower mat).
  // If target to emphasize is on BOTTOM (leader, hand, cost, chars, life, endTurn), overlay at the TOP (covering upper mat).
  const autoPosition: 'top' | 'bottom' = targetHighlight === 'opponent' ? 'bottom' : 'top';
  const currentPosition = manualPosition || autoPosition;

  // Reset manual position override when step changes
  useEffect(() => {
    setManualPosition(null);
  }, [currentStepIndex]);

  const togglePosition = () => {
    setManualPosition(currentPosition === 'top' ? 'bottom' : 'top');
  };

  const isDockedTop = currentPosition === 'top';

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 max-w-[640px] w-[95%] z-50 select-none transition-all duration-300 ease-out pointer-events-auto ${
        isDockedTop ? 'top-11 sm:top-12' : 'bottom-2 sm:bottom-3'
      }`}
    >
      {/* =======================================================================
          MINIMIZED PILL VIEW
         ======================================================================= */}
      {!isExpanded ? (
        <div className="flex items-center justify-center gap-1.5 animate-fadeIn">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="group px-3.5 py-1.5 rounded-full bg-[#111726]/95 hover:bg-[#182238] text-gray-100 text-xs font-semibold shadow-lg border border-white/20 flex items-center gap-2 backdrop-blur-md transition active:scale-98"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-bold text-white tracking-wide">{step.bannerPrompt}</span>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full font-mono text-gray-300">
              {step.id}/{OPTCG_TUTORIAL_STEPS.length}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
          </button>

          <button
            type="button"
            onClick={togglePosition}
            title={`Move tutorial to ${isDockedTop ? 'bottom' : 'top'}`}
            className="w-7 h-7 rounded-full bg-[#111726]/95 hover:bg-[#182238] border border-white/20 text-gray-300 hover:text-white flex items-center justify-center text-xs shadow-md backdrop-blur-md transition"
          >
            <ArrowUpDown className="w-3 h-3 text-gray-300" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings"
            className="w-7 h-7 rounded-full bg-[#111726]/95 hover:bg-[#182238] border border-white/20 text-gray-300 hover:text-white flex items-center justify-center text-xs shadow-md backdrop-blur-md transition"
          >
            <SlidersHorizontal className="w-3 h-3 text-gray-300" />
          </button>
        </div>
      ) : (
        /* =======================================================================
            EXPANDED ADAPTIVE OVERLAY CARD
           ======================================================================= */
        <div className="bg-[#101626]/95 border border-white/20 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-lg text-left animate-fadeIn text-gray-200">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  LESSON {step.id}: {step.subtitle}
                </span>
                <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded text-gray-300 font-mono">
                  {step.id}/{OPTCG_TUTORIAL_STEPS.length}
                </span>
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">{step.title}</h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={togglePosition}
                title={`Move to ${isDockedTop ? 'bottom' : 'top'}`}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                title="Minimize tutorial"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onCloseTutorial}
                title="Exit tutorial"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="py-2 text-xs text-gray-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto pr-1">
            {step.body}
          </div>

          {/* Goal instruction */}
          <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-gray-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-medium leading-snug">
              <strong className="text-white">Instruction:</strong> {step.instruction}
            </span>
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onSetStep(currentStepIndex - 1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                isFirst
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1">
              {OPTCG_TUTORIAL_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSetStep(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-4 bg-amber-400'
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            {isLast ? (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  onCloseTutorial();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
              >
                Complete
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSetStep(currentStepIndex + 1)}
                className="px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
