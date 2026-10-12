'use client';

import React, { useState } from 'react';
import { OPTCG_TUTORIAL_STEPS, TutorialStep } from '@/lib/sim/tutorial-data';
import { Sparkles, ChevronRight, ChevronLeft, X, BookOpen, CheckCircle2, HelpCircle } from 'lucide-react';

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
      {/* Floating Pill Banner matching OPlayTCG screenshot */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="group px-4 py-1.5 rounded-full bg-[#182638]/90 hover:bg-[#1e324a] text-cyan-300 font-bold text-xs tracking-wide shadow-lg border border-cyan-500/40 flex items-center gap-2 backdrop-blur-md transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-extrabold text-[12px]">{step.bannerPrompt}</span>
          <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.2 rounded-full font-mono text-cyan-200 border border-cyan-400/30">
            {step.id}/{OPTCG_TUTORIAL_STEPS.length}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Tutorial & Game Settings"
          className="w-7 h-7 rounded-full bg-[#182638]/90 hover:bg-[#1e324a] border border-white/15 text-gray-300 hover:text-white flex items-center justify-center text-xs shadow-md backdrop-blur-md transition"
        >
          ⚙
        </button>
      </div>

      {/* Expanded Interactive Guidance Drawer */}
      {isExpanded && (
        <div className="mt-2 max-w-md w-full bg-[#0d1522]/95 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-left animate-fadeIn">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                Lesson {step.id}: {step.subtitle}
              </span>
              <h3 className="text-sm font-black text-white mt-0.5">{step.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5 text-xs text-gray-300 whitespace-pre-line leading-relaxed">
            {step.description}
          </div>

          {step.recommendedAction && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium">
                <strong className="text-white">Goal:</strong> {step.recommendedAction}
              </span>
            </div>
          )}

          {/* Step Navigation Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onSetStep(currentStepIndex - 1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                isFirst
                  ? 'text-gray-600 bg-white/5 cursor-not-allowed'
                  : 'text-gray-300 hover:text-white bg-white/10 hover:bg-white/15'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1">
              {OPTCG_TUTORIAL_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSetStep(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-4 bg-cyan-400'
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
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md transition"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSetStep(currentStepIndex + 1)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-1 shadow-md transition"
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
