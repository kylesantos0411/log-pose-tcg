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
  Sparkles,
  Maximize2,
  Eye,
  EyeOff,
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
  const step: TutorialStep = OPTCG_TUTORIAL_STEPS[currentStepIndex] || OPTCG_TUTORIAL_STEPS[0];
  const [isExpanded, setIsExpanded] = useState(true);
  const [manualPosition, setManualPosition] = useState<'top' | 'bottom' | null>(null);

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex >= OPTCG_TUTORIAL_STEPS.length - 1;

  // Whenever step index changes, automatically reset manual override and keep expanded
  // so the overlay moves on its own to cover the unnecessary section of the board
  useEffect(() => {
    setIsExpanded(true);
    setManualPosition(null);
  }, [currentStepIndex]);

  // Determine smart position:
  // If target to emphasize is on TOP (opponent), the overlay moves on its own to the BOTTOM,
  // covering the player mat so the opponent area stays uncovered without scrolling.
  // If target to emphasize is on BOTTOM (leader, hand, costArea, characters, life, endTurn),
  // the overlay moves on its own to the TOP, covering the opponent mat so the player area stays uncovered without scrolling.
  const isTargetTop = targetHighlight === 'opponent';
  const autoPosition: 'top' | 'bottom' = isTargetTop ? 'bottom' : 'top';
  const currentPosition = manualPosition || autoPosition;
  const isDockedTop = currentPosition === 'top';

  const togglePosition = () => {
    setManualPosition(currentPosition === 'top' ? 'bottom' : 'top');
  };

  // ===========================================================================
  // 1. ZOOMED CARD INSPECTION CALLOUT MODE (Screenshots 2 & 3 in OPlayTCG)
  // ===========================================================================
  if (step.inspectCard) {
    const { inspectCard } = step;

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-3 animate-fadeIn select-none pointer-events-auto">
        {/* Center Card Zoom Frame with Callouts */}
        <div className="relative flex flex-col items-center justify-center my-auto">
          {/* Main Card Image */}
          <div className="relative w-52 sm:w-64 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
            <img
              src={inspectCard.imageUrl}
              alt={inspectCard.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Callout Badges with Pointers */}
          {inspectCard.callouts.map((callout, idx) => {
            if (callout.position === 'top-right') {
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute -top-3 sm:-top-4 -right-16 sm:-right-24 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-amber-400/80" />
                  <div className="px-3 py-1 rounded-lg bg-[#141b2a] text-amber-300 font-black text-xs sm:text-sm shadow-xl border border-amber-500/40 tracking-wide font-mono flex items-center gap-1.5">
                    <span>{callout.label}</span>
                  </div>
                </div>
              );
            }

            if (callout.position === 'top-left') {
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute -top-3 sm:-top-4 -left-16 sm:-left-24 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="px-3 py-1 rounded-lg bg-[#141b2a] text-amber-300 font-black text-xs sm:text-sm shadow-xl border border-amber-500/40 tracking-wide font-mono flex items-center gap-1.5">
                    <span>{callout.label}</span>
                  </div>
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-amber-400/80" />
                </div>
              );
            }

            if (callout.position === 'left') {
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute top-1/2 -translate-y-1/2 -left-20 sm:-left-32 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="px-3 py-1 rounded-lg bg-[#141b2a] text-amber-300 font-black text-xs sm:text-sm shadow-xl border border-amber-500/40 tracking-wide font-mono flex items-center gap-1.5">
                    <span>{callout.label}</span>
                  </div>
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-amber-400/80" />
                </div>
              );
            }

            if (callout.position === 'bottom-right') {
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute -bottom-2 -right-14 sm:-right-20 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-amber-400/80" />
                  <div className="px-3 py-1 rounded-lg bg-[#141b2a] text-amber-300 font-black text-xs sm:text-sm shadow-xl border border-amber-500/40 tracking-wide font-mono flex items-center gap-1.5">
                    <span>{callout.label}</span>
                  </div>
                </div>
              );
            }

            if (callout.position === 'bottom-left') {
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute -bottom-2 -left-16 sm:-left-24 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="px-3 py-1 rounded-lg bg-[#141b2a] text-amber-300 font-black text-xs sm:text-sm shadow-xl border border-amber-500/40 tracking-wide flex items-center gap-1.5">
                    <span>{callout.label}</span>
                    {callout.dotColor && (
                      <span
                        className="w-3 h-3 rounded-full inline-block border border-white/20"
                        style={{ backgroundColor: callout.dotColor }}
                      />
                    )}
                  </div>
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-amber-400/80" />
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Dialogue Box Docked Below Card in Log Pose Dark Theme */}
        <div className="bg-[#101626] text-gray-200 border border-[#232f48] shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-[620px] w-[95%] animate-fadeIn mt-4">
          <div className="flex items-start justify-between pb-1.5">
            <div>
              <div className="text-amber-400 font-black uppercase tracking-wider text-[11px] sm:text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{step.title}</span>
              </div>
              <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                Chapter {step.chapter} of {step.totalChapters || 16}
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseTutorial}
              title="Close Tutorial"
              className="p-1 rounded-lg text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed py-2">
            {step.body}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onCloseTutorial}
              className="text-xs text-gray-400 hover:text-white font-semibold px-2 py-1 transition"
            >
              Exit
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isFirst}
                onClick={() => onSetStep(currentStepIndex - 1)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  isFirst
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => onSetStep(currentStepIndex + 1)}
                className="px-5 py-1.5 rounded-full bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold shadow-md flex items-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <span>Next</span>
                <span className="text-[10px]">▷</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 2. DYNAMIC OVERLAY THAT COVERS THE UNNECESSARY PART OF THE TABLETOP (LOG POSE DARK THEME)
  // ===========================================================================
  return (
    <>
      {/* If expanded, this container physically covers the inactive half of the board */}
      {isExpanded ? (
        <div
          className={`fixed inset-x-0 z-40 bg-[#0a0e17]/90 backdrop-blur-xs transition-all duration-300 ease-in-out flex flex-col items-center justify-center px-3 py-2 sm:px-4 sm:py-3 shadow-2xl pointer-events-auto border-[#1e293b] ${
            isDockedTop
              ? 'top-0 border-b max-h-[50vh] sm:max-h-[46vh] overflow-y-auto'
              : 'bottom-0 border-t max-h-[50vh] sm:max-h-[46vh] overflow-y-auto'
          }`}
        >
          {/* Active Dialogue Card */}
          <div className="bg-[#101626] text-gray-200 border border-[#232f48] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl max-w-[640px] w-full text-left my-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-1">
              <div>
                <div className="text-amber-400 font-black uppercase tracking-wider text-[11px] sm:text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{step.title}</span>
                  {step.bannerPrompt && (
                    <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9.5px] font-bold border border-amber-500/30">
                      {step.bannerPrompt}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  Chapter {step.chapter} of {step.totalChapters || 16} &bull; Covered:{' '}
                  <span className="text-gray-200 font-bold">{isDockedTop ? 'Opponent Side' : 'Player Side'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Manual flip position button */}
                <button
                  type="button"
                  onClick={togglePosition}
                  title={`Flip overlay to cover ${isDockedTop ? 'player side (dock bottom)' : 'opponent side (dock top)'}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>

                {/* Minimize to peek at entire board */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  title="Minimize overlay"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onCloseTutorial}
                  title="Exit tutorial"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed py-1.5 whitespace-pre-line">
              {step.body}
            </p>

            {/* Instruction Box */}
            {step.instruction && (
              <div className="mb-2 px-3 py-1.5 rounded-xl bg-[#151c2e] border border-[#263552] text-gray-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-medium leading-snug">
                  <strong className="text-white">Task:</strong> {step.instruction}
                </span>
              </div>
            )}

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onCloseTutorial}
                className="text-xs text-gray-400 hover:text-white font-semibold px-2 py-1 transition"
              >
                Exit
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => onSetStep(currentStepIndex - 1)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                    isFirst
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  Back
                </button>

                {isLast ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      onCloseTutorial();
                    }}
                    className="px-5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    Finish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetStep(currentStepIndex + 1)}
                    className="px-5 py-1.5 rounded-full bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold shadow-md flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <span>Next</span>
                    <span className="text-[10px]">▷</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Minimized Floating Pill View */
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-50 select-none animate-fadeIn pointer-events-auto ${
            isDockedTop ? 'top-3 sm:top-4' : 'bottom-3 sm:bottom-4'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="px-4 py-2 rounded-full bg-[#101626] hover:bg-[#151c2e] text-white text-xs font-bold shadow-xl border border-[#232f48] flex items-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="tracking-wide text-amber-300">{step.bannerPrompt}</span>
              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-mono text-gray-400">
                {step.chapter}/{step.totalChapters || 16}
              </span>
              <Eye className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={togglePosition}
              title={`Move to ${isDockedTop ? 'bottom' : 'top'}`}
              className="w-8 h-8 rounded-full bg-[#101626] hover:bg-[#151c2e] border border-[#232f48] text-gray-300 hover:text-white flex items-center justify-center text-xs shadow-md transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
