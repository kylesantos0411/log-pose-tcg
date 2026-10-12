'use client';

import React, { useState } from 'react';
import { OPTCG_TUTORIAL_STEPS, TutorialStep } from '@/lib/sim/tutorial-data';
import { ChevronRight, ChevronLeft, X, CheckCircle2, SlidersHorizontal, BookOpen } from 'lucide-react';

interface SimTutorialBannerProps {
  currentStepIndex: number;
  onSetStep: (index: number) => void;
  onCloseTutorial: () => void;
  onOpenSettings: () => void;
}

export function SimTutorialBanner({
  currentStepIndex,
  onSetStep,
  onCloseTutorial,
  onOpenSettings,
}: SimTutorialBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const step: TutorialStep = OPTCG_TUTORIAL_STEPS[currentStepIndex] || OPTCG_TUTORIAL_STEPS[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex >= OPTCG_TUTORIAL_STEPS.length - 1;

  return (
    <div className="w-full flex flex-col items-center justify-center my-1 z-30 select-none">
      {/* Clean, minimalist floating banner matching OPlayTCG */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="group px-3.5 py-1.5 rounded-full bg-[#131b2e]/95 hover:bg-[#1a253e] text-gray-100 text-xs font-semibold shadow-md border border-white/15 flex items-center gap-2 backdrop-blur-sm transition active:scale-98"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[11px] tracking-wide font-bold text-white">{step.bannerPrompt}</span>
          <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full font-mono text-gray-300">
            {step.id}/{OPTCG_TUTORIAL_STEPS.length}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings & Lessons"
          className="w-7 h-7 rounded-full bg-[#131b2e]/95 hover:bg-[#1a253e] border border-white/15 text-gray-300 hover:text-white flex items-center justify-center text-xs shadow-md transition"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-300" />
        </button>
      </div>

      {/* Clean Drawer with step details */}
      {isExpanded && (
        <div className="mt-2 max-w-md w-full bg-[#111726]/98 border border-white/15 rounded-xl p-4 shadow-xl backdrop-blur-md text-left animate-fadeIn">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Lesson {step.id}: {step.subtitle}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">{step.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5 text-xs text-gray-300 whitespace-pre-line leading-relaxed">
            {step.body}
          </div>

          <div className="mb-3 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-gray-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px]">
              <strong className="text-white">Instruction:</strong> {step.instruction}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onSetStep(currentStepIndex - 1)}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
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
                      ? 'w-3.5 bg-amber-400'
                      : 'bg-white/25 hover:bg-white/40'
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
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                Complete
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSetStep(currentStepIndex + 1)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition"
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
