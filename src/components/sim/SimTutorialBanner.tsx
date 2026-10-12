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
  const [isExpanded, setIsExpanded] = useState(!step.isActionStep);
  const [manualPosition, setManualPosition] = useState<'top' | 'bottom' | null>(null);

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex >= OPTCG_TUTORIAL_STEPS.length - 1;

  // Whenever step changes, default to expanded unless it is specifically an action prompt (like "✦ Attach a DON!!")
  useEffect(() => {
    setIsExpanded(!step.isActionStep);
    setManualPosition(null);
  }, [currentStepIndex, step.isActionStep]);

  // Determine smart position:
  // If target to highlight is on TOP (opponent), dock at BOTTOM.
  // If target to highlight is on BOTTOM (leader, hand, cost, chars, life), dock at TOP.
  const autoPosition: 'top' | 'bottom' = targetHighlight === 'opponent' ? 'bottom' : 'top';
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
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-3 animate-fadeIn select-none pointer-events-auto">
        {/* Center Card Zoom Frame with Callouts */}
        <div className="relative flex flex-col items-center justify-center my-auto">
          {/* Main Card Image */}
          <div className="relative w-52 sm:w-64 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/25">
            <img
              src={inspectCard.imageUrl}
              alt={inspectCard.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Callout Badges with Pointers */}
          {inspectCard.callouts.map((callout, idx) => {
            // Position mapping matching OPlayTCG Screenshots 2 and 3:
            if (callout.position === 'top-right') {
              // POWER 5000 Badge
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute -top-3 sm:-top-4 -right-16 sm:-right-24 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-white/80" />
                  <div className="px-3 py-1 rounded-lg bg-white text-slate-900 font-black text-xs sm:text-sm shadow-xl border border-gray-200 tracking-wide font-mono flex items-center gap-1.5">
                    <span>{callout.label}</span>
                  </div>
                </div>
              );
            }

            if (callout.position === 'top-left') {
              // COST 3 Badge
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute -top-3 sm:-top-4 -left-16 sm:-left-24 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="px-3 py-1 rounded-lg bg-white text-slate-900 font-black text-xs sm:text-sm shadow-xl border border-gray-200 tracking-wide font-mono flex items-center gap-1.5">
                    <span>{callout.label}</span>
                  </div>
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-white/80" />
                </div>
              );
            }

            if (callout.position === 'left') {
              // COUNTER +1000 Badge
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute top-1/2 -translate-y-1/2 -left-20 sm:-left-32 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="px-3 py-1 rounded-lg bg-white text-slate-900 font-black text-xs sm:text-sm shadow-xl border border-gray-200 tracking-wide font-mono flex items-center gap-1.5">
                    <span>{callout.label}</span>
                  </div>
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-white/80" />
                </div>
              );
            }

            if (callout.position === 'bottom-right') {
              // LIFE 5 Badge
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute -bottom-2 -right-14 sm:-right-20 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-white/80" />
                  <div className="px-3 py-1 rounded-lg bg-white text-slate-900 font-black text-xs sm:text-sm shadow-xl border border-gray-200 tracking-wide font-mono flex items-center gap-1.5">
                    <span>{callout.label}</span>
                  </div>
                </div>
              );
            }

            if (callout.position === 'bottom-left') {
              // COLOR Badge
              return (
                <div
                  key={`callout-${idx}`}
                  className="absolute -bottom-2 -left-16 sm:-left-24 flex items-center gap-1.5 animate-fadeIn"
                >
                  <div className="px-3 py-1 rounded-lg bg-white text-slate-900 font-black text-xs sm:text-sm shadow-xl border border-gray-200 tracking-wide flex items-center gap-1.5">
                    <span>{callout.label}</span>
                    {callout.dotColor && (
                      <span
                        className="w-3 h-3 rounded-full inline-block border border-black/20"
                        style={{ backgroundColor: callout.dotColor }}
                      />
                    )}
                  </div>
                  <div className="w-6 sm:w-10 border-t-2 border-dashed border-white/80" />
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Dialogue Box Docked Below Card (OPlayTCG Screenshots 2 & 3) */}
        <div className="bg-[#faf7ee] text-slate-800 border border-[#e2d9c2] shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-[620px] w-[95%] animate-fadeIn mt-4">
          {/* Header */}
          <div className="flex items-start justify-between pb-1.5">
            <div>
              <div className="text-[#b45309] font-black uppercase tracking-wider text-[11px] sm:text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#b45309]" />
                <span>{step.title}</span>
              </div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                Chapter {step.chapter} of {step.totalChapters || 16}
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseTutorial}
              title="Close Tutorial"
              className="p-1 rounded-lg text-gray-400 hover:text-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed py-2">
            {step.body}
          </p>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#ede5d0]">
            <button
              type="button"
              onClick={onCloseTutorial}
              className="text-xs text-gray-500 hover:text-slate-800 font-semibold px-2 py-1 transition"
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
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'bg-black/5 hover:bg-black/10 text-slate-800'
                }`}
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => onSetStep(currentStepIndex + 1)}
                className="px-5 py-1.5 rounded-full bg-[#c27803] hover:bg-[#a66402] text-white text-xs font-bold shadow-md flex items-center gap-1 transition active:scale-95 cursor-pointer"
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
  // 2. STANDARD TABLETOP DIALOGUE BOX / FLOATING PILL (Screenshots 1, 4, 5)
  // ===========================================================================
  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 max-w-[620px] w-[95%] z-50 select-none transition-all duration-300 ease-out pointer-events-auto ${
        isDockedTop ? 'top-10 sm:top-12' : 'bottom-3 sm:bottom-4'
      }`}
    >
      {/* =======================================================================
          A. FLOATING PILL VIEW (Screenshot 1, 4, 5)
         ======================================================================= */}
      {!isExpanded ? (
        <div className="flex items-center justify-center gap-1.5 animate-fadeIn">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="group px-4 py-2 rounded-full bg-[#faf7ee] hover:bg-[#f5f0e3] text-slate-800 text-xs font-bold shadow-xl border border-[#e2d9c2] flex items-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="tracking-wide text-slate-900">{step.bannerPrompt}</span>
            <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded-full font-mono text-gray-500">
              {step.chapter}/{step.totalChapters || 16}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-slate-900" />
          </button>

          <button
            type="button"
            onClick={togglePosition}
            title={`Move dialogue to ${isDockedTop ? 'bottom' : 'top'}`}
            className="w-8 h-8 rounded-full bg-[#faf7ee] hover:bg-[#f5f0e3] border border-[#e2d9c2] text-gray-600 hover:text-slate-900 flex items-center justify-center text-xs shadow-md transition"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* =======================================================================
            B. EXPANDED DIALOGUE BOX (Screenshot 1: The Leader, Chapter 1 of 16)
           ======================================================================= */
        <div className="bg-[#faf7ee] text-slate-800 border border-[#e2d9c2] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl text-left animate-fadeIn">
          {/* Header */}
          <div className="flex items-start justify-between pb-1.5">
            <div>
              <div className="text-[#b45309] font-black uppercase tracking-wider text-[11px] sm:text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#b45309]" />
                <span>{step.title}</span>
              </div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                Chapter {step.chapter} of {step.totalChapters || 16}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={togglePosition}
                title={`Move to ${isDockedTop ? 'bottom' : 'top'}`}
                className="p-1.5 rounded-lg text-gray-400 hover:text-slate-800 hover:bg-black/5 transition"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                title="Minimize to floating pill"
                className="p-1.5 rounded-lg text-gray-400 hover:text-slate-800 hover:bg-black/5 transition"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onCloseTutorial}
                title="Exit tutorial"
                className="p-1.5 rounded-lg text-gray-400 hover:text-slate-800 hover:bg-black/5 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed py-2 whitespace-pre-line">
            {step.body}
          </p>

          {/* Instruction Box */}
          {step.instruction && (
            <div className="mb-2.5 px-3 py-2 rounded-xl bg-[#f0ebe0] border border-[#e2d9c2] text-slate-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-[11px] font-medium leading-snug">
                <strong className="text-slate-900">Instruction:</strong> {step.instruction}
              </span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#ede5d0]">
            <button
              type="button"
              onClick={onCloseTutorial}
              className="text-xs text-gray-500 hover:text-slate-800 font-semibold px-2 py-1 transition"
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
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'bg-black/5 hover:bg-black/10 text-slate-800'
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
                  Complete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetStep(currentStepIndex + 1)}
                  className="px-5 py-1.5 rounded-full bg-[#c27803] hover:bg-[#a66402] text-white text-xs font-bold shadow-md flex items-center gap-1 transition active:scale-95 cursor-pointer"
                >
                  <span>Next</span>
                  <span className="text-[10px]">▷</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
