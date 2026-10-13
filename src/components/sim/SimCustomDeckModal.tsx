'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Layers, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Play, 
  Save, 
  Trash2, 
  FileText, 
  HelpCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { RecommendedDeck } from '@/lib/recommended-decks';
import { parseCustomDeckText } from '@/lib/sim/sim-deck-parser';
import { getEditionCardImageUrl, handleCardImageError } from '@/lib/card-image';
import { createCustomDeck, setActiveCustomDeckId } from '@/lib/custom-decks';

interface SimCustomDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeck: (deck: RecommendedDeck) => void;
  onDeckSaved?: (deck: RecommendedDeck) => void;
}

const SAMPLE_DECKS = [
  {
    name: 'Red Zoro Aggro',
    leader: 'OP01-025',
    text: `1xOP01-025
4xST01-006
4xST01-011
4xST01-012
4xST01-013
4xOP01-006
4xOP01-016
4xOP01-017
4xOP01-029
4xOP01-033
4xOP01-035
4xOP01-027
4xOP01-028
2xST01-014`,
  },
  {
    name: 'Yellow Enel Control',
    leader: 'OP05-098',
    text: `1xOP05-098
4xOP05-100
4xOP05-101
4xOP05-102
4xOP05-105
4xOP05-106
4xOP05-110
4xOP05-115
4xOP03-112
4xOP03-114
4xOP03-115
4xOP04-100
4xOP04-104
2xOP05-119`,
  },
  {
    name: 'Straw Hat Crew (ST-01)',
    leader: 'ST01-001',
    text: `1xST01-001
4xST01-006
4xST01-007
4xST01-011
4xST01-012
4xST01-013
4xST01-002
4xST01-003
4xST01-004
4xST01-005
4xST01-008
4xST01-010
2xST01-014
4xST01-015`,
  },
];

export function SimCustomDeckModal({
  isOpen,
  onClose,
  onSelectDeck,
  onDeckSaved,
}: SimCustomDeckModalProps) {
  const router = useRouter();
  const [deckName, setDeckName] = useState('My Custom Deck');
  const [deckText, setDeckText] = useState('');
  const [parsedDeck, setParsedDeck] = useState<RecommendedDeck | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleBrowseCards = () => {
    let deckToBuild = parsedDeck;
    if (!deckToBuild) {
      deckToBuild = createCustomDeck(deckName.trim() || 'My Custom Deck');
      if (onDeckSaved) onDeckSaved(deckToBuild);
    } else {
      handleSaveToStorage();
    }
    setActiveCustomDeckId(deckToBuild.id);
    onClose();
    router.push('/cards');
  };

  // Parse text whenever input changes
  useEffect(() => {
    if (!deckText.trim()) {
      setParsedDeck(null);
      setParseErrors([]);
      return;
    }

    const { deck, errors } = parseCustomDeckText(deckText, deckName.trim() || 'Custom Test Deck');
    setParsedDeck(deck);
    setParseErrors(errors);
  }, [deckText, deckName]);

  if (!isOpen) return null;

  const totalCardsCount = parsedDeck
    ? parsedDeck.cards.reduce((sum, c) => sum + c.quantity, 0)
    : 0;

  const handleSaveToStorage = () => {
    if (!parsedDeck) return;

    try {
      const existingRaw = localStorage.getItem('optcg_custom_decks');
      const existing: RecommendedDeck[] = existingRaw ? JSON.parse(existingRaw) : [];
      
      // Update if already exists with same id or add
      const updated = [
        parsedDeck,
        ...existing.filter((d) => d.id !== parsedDeck.id && d.name !== parsedDeck.name),
      ];

      localStorage.setItem('optcg_custom_decks', JSON.stringify(updated));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);

      if (onDeckSaved) {
        onDeckSaved(parsedDeck);
      }
    } catch (e) {
      console.error('Failed to save custom deck to localStorage', e);
    }
  };

  const handlePlayNow = () => {
    if (!parsedDeck) return;
    handleSaveToStorage();
    onSelectDeck(parsedDeck);
    onClose();
  };

  const handleLoadSample = (sample: typeof SAMPLE_DECKS[0]) => {
    setDeckName(sample.name);
    setDeckText(sample.text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#11141e] border border-[#23293a] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1f2434] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2133] border border-[#29344e] flex items-center justify-center text-slate-300">
              <Layers className="w-4 h-4 text-slate-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Create & Test Custom Deck
              </h2>
              <p className="text-[11px] text-slate-400">
                Paste your card list or Bandai export to practice with official rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#181c29] hover:bg-[#22273a] text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Deck Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Deck Name
            </label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="e.g. Red Zoro Tournament, My Enel Test..."
              className="w-full bg-[#161a26] border border-[#262c3e] focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Visual Card Catalog Picker shortcut */}
          <div className="p-3.5 rounded-2xl bg-[#161c2b] border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Interactive Card Catalog Builder</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Browse sets or search cards, then click &quot;Add to Deck&quot; directly
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBrowseCards}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
            >
              <span>Browse &amp; Pick Cards &rarr;</span>
            </button>
          </div>

          {/* Quick Sample Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400">
                Quick Template Examples:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_DECKS.map((sample) => (
                <button
                  key={sample.name}
                  onClick={() => handleLoadSample(sample)}
                  className="px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#23293a] border border-[#262c3e] text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{sample.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Decklist Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                Deck List Text (Format: <code className="text-slate-400">1xOP01-001</code> or <code className="text-slate-400">4 ST01-012</code>)
              </label>
              {deckText && (
                <button
                  onClick={() => setDeckText('')}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              rows={8}
              value={deckText}
              onChange={(e) => setDeckText(e.target.value)}
              placeholder={`Paste any deck list here, e.g.:
1xST01-001 (Leader)
4xST01-006
4xST01-011
4xST01-012
4xOP01-025
...`}
              className="w-full font-mono text-[11px] bg-[#141722] border border-[#252b3d] focus:border-slate-400 rounded-xl p-3 text-slate-200 placeholder-slate-600 outline-none transition resize-y leading-relaxed"
            />
          </div>

          {/* Real-time Deck Validation & Preview */}
          {parsedDeck ? (
            <div className="p-3.5 rounded-xl bg-[#141824] border border-[#242b3d] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300">
                    Deck Validated Successfully
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    totalCardsCount === 50
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                      : 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                  }`}>
                    {totalCardsCount} / 50 Cards
                  </span>
                </div>
              </div>

              {/* Leader & Summary Preview */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0e111a] border border-[#1d2232]">
                <div className="w-11 aspect-[2.5/3.5] rounded overflow-hidden bg-black/50 border border-white/10 shrink-0">
                  <img
                    src={getEditionCardImageUrl(parsedDeck.leaderId, 'jp')}
                    alt={parsedDeck.leaderName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleCardImageError(e, parsedDeck.leaderId, '')}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-medium">
                      Leader: {parsedDeck.leaderId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {parsedDeck.color}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate mt-0.5">
                    {parsedDeck.leaderName}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {parsedDeck.cards.length} distinct cards • {totalCardsCount} total copies
                  </p>
                </div>
              </div>

              {/* Card List Preview (Compact Badges) */}
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {parsedDeck.cards.map((card) => (
                  <div
                    key={card.cardId}
                    className="flex items-center justify-between px-2.5 py-1 rounded bg-[#171b28] text-[11px] border border-[#232839]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-semibold text-slate-400 w-5 text-right">
                        {card.quantity}x
                      </span>
                      <span className="font-mono text-slate-300 font-medium">
                        {card.cardId}
                      </span>
                      <span className="text-slate-400 truncate">
                        {card.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                      {card.category} {card.cost ? `• ${card.cost} cost` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : deckText.trim() ? (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">No valid cards detected yet</p>
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  Make sure to include One Piece card codes like <code className="text-amber-200">1xST01-001</code> and <code className="text-amber-200">4xOP01-016</code>.
                </p>
              </div>
            </div>
          ) : null}

          {/* Guide hint */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#141722] border border-[#202534] text-slate-400 text-[11px] leading-relaxed">
            <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-300">Supported Formats:</p>
              <p>
                Official Bandai TCG+, GumGum, OPTCGSim, or manual lines:
                <span className="text-slate-200 font-mono ml-1">1xOP01-001</span>, 
                <span className="text-slate-200 font-mono ml-1">4xST01-012</span>, 
                <span className="text-slate-200 font-mono ml-1">4 OP01-016</span>.
                All 3,903 One Piece cards are recognized with official effects, power, triggers, and counters!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#1f2434] bg-[#0f121b] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToStorage}
              disabled={!parsedDeck}
              className="px-3.5 py-2 rounded-xl bg-[#1a1f2e] hover:bg-[#252c40] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-[#2b3349] transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Saved to Decks!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Deck</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-[#1a1e2b] text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePlayNow}
              disabled={!parsedDeck}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-md flex items-center gap-2 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test Deck Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
