'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  X, 
  Layers, 
  Plus, 
  Minus, 
  Check, 
  Sparkles, 
  Crown, 
  AlertCircle,
  Gamepad2,
  FolderPlus,
  ChevronDown
} from 'lucide-react';
import { RecommendedDeck } from '@/lib/recommended-decks';
import { 
  getCustomDecks, 
  getActiveCustomDeckId, 
  createCustomDeck, 
  addCardToCustomDeck, 
  addMultipleCardsToCustomDeck,
  extractCleanCardCode
} from '@/lib/custom-decks';
import { getSafeCardImageUrl, handleCardImageError } from '@/lib/card-image';

interface AddToDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: any[]; // Single card or array of cards
  onSuccess?: (deck: RecommendedDeck, totalAdded: number) => void;
}

export function AddToDeckModal({
  isOpen,
  onClose,
  cards,
  onSuccess,
}: AddToDeckModalProps) {
  const [customDecks, setCustomDecks] = useState<RecommendedDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  
  // Single card quantity state
  const [singleQuantity, setSingleQuantity] = useState<number>(4);
  const [setAsLeader, setSetAsLeader] = useState(false);

  // Bulk quantities mapping { cardCode: quantity }
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>({});

  const isBulk = cards.length > 1;
  const singleCard = cards.length === 1 ? cards[0] : null;

  // Load custom decks from storage whenever opened
  useEffect(() => {
    if (!isOpen) return;

    const decks = getCustomDecks();
    setCustomDecks(decks);

    const activeId = getActiveCustomDeckId();
    if (activeId && decks.some((d) => d.id === activeId)) {
      setSelectedDeckId(activeId);
      setIsCreatingNew(false);
    } else if (decks.length > 0) {
      setSelectedDeckId(decks[0].id);
      setIsCreatingNew(false);
    } else {
      setIsCreatingNew(true);
      const defaultName = singleCard 
        ? `${singleCard.name || 'Custom'} Deck` 
        : 'My Custom Deck';
      setNewDeckName(defaultName);
    }

    if (singleCard) {
      const isLeader = (singleCard.category || '').toLowerCase() === 'leader';
      setSetAsLeader(isLeader);
      setSingleQuantity(isLeader ? 1 : 4);
    } else {
      const initialBulk: Record<string, number> = {};
      cards.forEach((c) => {
        const code = extractCleanCardCode(c);
        const isLeader = (c.category || '').toLowerCase() === 'leader';
        initialBulk[code] = isLeader ? 1 : 4;
      });
      setBulkQuantities(initialBulk);
    }
  }, [isOpen, cards, singleCard]);

  // Selected deck details
  const activeDeck = useMemo(() => {
    return customDecks.find((d) => d.id === selectedDeckId) || null;
  }, [customDecks, selectedDeckId]);

  // Total cards in active deck right now
  const currentDeckTotalCards = useMemo(() => {
    if (!activeDeck) return 0;
    return activeDeck.cards.reduce((sum, c) => sum + (c.quantity || 0), 0);
  }, [activeDeck]);

  // Total cards that will be added
  const addingCount = useMemo(() => {
    if (isBulk) {
      return Object.values(bulkQuantities).reduce((sum, q) => sum + q, 0);
    }
    return setAsLeader ? 0 : singleQuantity;
  }, [isBulk, bulkQuantities, singleQuantity, setAsLeader]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let targetDeckId = selectedDeckId;

    if (isCreatingNew || !targetDeckId) {
      const name = newDeckName.trim() || 'My Custom Deck';
      const created = createCustomDeck(name, setAsLeader ? singleCard : undefined);
      targetDeckId = created.id;
    }

    let finalDeck: RecommendedDeck;
    let totalAdded = 0;

    if (!isBulk && singleCard) {
      const res = addCardToCustomDeck(targetDeckId, singleCard, singleQuantity, setAsLeader);
      finalDeck = res.deck;
      totalAdded = res.addedQty;
    } else {
      // Bulk add
      const cardsWithQuantities = cards.map((c) => {
        const code = extractCleanCardCode(c);
        return {
          ...c,
          customQty: bulkQuantities[code] || 4,
        };
      });

      let currentDeck = customDecks.find((d) => d.id === targetDeckId) || getCustomDecks().find((d) => d.id === targetDeckId);
      if (!currentDeck) {
        currentDeck = createCustomDeck(newDeckName || 'My Custom Deck');
        targetDeckId = currentDeck.id;
      }

      for (const item of cardsWithQuantities) {
        const res = addCardToCustomDeck(targetDeckId, item, item.customQty);
        totalAdded += res.addedQty;
        currentDeck = res.deck;
      }
      finalDeck = currentDeck!;
    }

    if (onSuccess) {
      onSuccess(finalDeck, totalAdded);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141620] border border-[#252c3e] rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#222533] flex items-center justify-between bg-[#10121a]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {isBulk ? `Add ${cards.length} Cards to Deck` : 'Add Card to Custom Deck'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Choose or create a deck for simulator playtesting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Deck Selection Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Custom Deck
              </label>
              {customDecks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(!isCreatingNew)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {isCreatingNew ? (
                    'Select Existing Deck'
                  ) : (
                    <>
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>New Deck</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {isCreatingNew || customDecks.length === 0 ? (
              <div className="space-y-1.5 p-3 rounded-2xl bg-[#181b26] border border-[#262c3d]">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                  <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Create a New Deck Build</span>
                </div>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="e.g. Red Zoro Aggro, Enel Control, Mihawk Green..."
                  className="w-full px-3 py-2 bg-[#10121a] border border-[#2b3245] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 bg-[#181b26] border border-[#262c3d] focus:border-blue-500 rounded-xl text-xs font-medium text-white outline-none cursor-pointer pr-9"
                  >
                    {customDecks.map((d) => {
                      const count = d.cards.reduce((sum, c) => sum + (c.quantity || 0), 0);
                      return (
                        <option key={d.id} value={d.id}>
                          {d.name} ({count}/50 cards • {d.leaderName || d.leaderId})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Deck Card Count Status Bar */}
                {activeDeck && (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#10121a] border border-[#202434] text-[11px] text-slate-400">
                    <span>
                      Leader: <strong className="text-white">{activeDeck.leaderName}</strong>
                    </span>
                    <span>
                      Deck: <strong className="text-amber-400">{currentDeckTotalCards}</strong>/50
                      {addingCount > 0 && (
                        <span className="text-emerald-400 font-semibold ml-1">
                          (+{addingCount} &rarr; {currentDeckTotalCards + addingCount})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SINGLE CARD PREVIEW & CONFIG */}
          {!isBulk && singleCard && (
            <div className="p-3.5 rounded-2xl bg-[#181b26] border border-[#262c3d] space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-13 aspect-[2.5/3.5] rounded-lg overflow-hidden bg-black/50 border border-white/10 shrink-0 shadow-sm">
                  <img
                    src={getSafeCardImageUrl(singleCard.imageUrl, singleCard.id || singleCard.cardNumber)}
                    alt={singleCard.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => handleCardImageError(e, singleCard.id || singleCard.cardNumber, singleCard.imageUrl)}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-blue-400">
                      {extractCleanCardCode(singleCard)}
                    </span>
                    {singleCard.category && (
                      <span className="px-1.5 py-0.2 rounded bg-white/10 text-slate-300 text-[10px] font-semibold">
                        {singleCard.category}
                      </span>
                    )}
                    {singleCard.colors && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                        {singleCard.colors}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">
                    {singleCard.name}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    {typeof singleCard.cost === 'number' && (
                      <span>Cost: <strong className="text-white">{singleCard.cost}</strong></span>
                    )}
                    {typeof singleCard.power === 'number' && (
                      <span>Power: <strong className="text-white">{singleCard.power}</strong></span>
                    )}
                    {typeof singleCard.counter === 'number' && singleCard.counter > 0 && (
                      <span>Counter: <strong className="text-amber-400">+{singleCard.counter}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Set As Leader Toggle (if Leader category or user wants) */}
              {(singleCard.category || '').toLowerCase() === 'leader' ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-200">
                      Set as Deck Leader
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={setAsLeader}
                    onChange={(e) => setSetAsLeader(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                </div>
              ) : null}

              {/* Quantity Selector (Max 4 copies in OPTCG rules) */}
              {!setAsLeader && (
                <div className="space-y-1.5 pt-1 border-t border-[#222736]">
                  <div className="flex items-center justify-between text-slate-300 text-xs">
                    <span>Quantity to Add</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Official rules: Max 4 copies
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl bg-[#10121a] border border-[#2b3245] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setSingleQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-bold text-white text-sm">
                        {singleQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSingleQuantity((q) => Math.min(4, q + 1))}
                        className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Play-set buttons: 1x, 2x, 4x */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 4].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSingleQuantity(amt)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                            singleQuantity === amt
                              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                              : 'bg-[#10121a] text-slate-400 border-[#2b3245] hover:text-white'
                          }`}
                        >
                          {amt}x{amt === 4 ? ' (Playset)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BULK CARDS PREVIEW & QUANTITIES */}
          {isBulk && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
                <span>Selected Cards ({cards.length})</span>
                <span className="text-slate-400 font-normal">
                  Total: <strong className="text-white">+{addingCount}</strong> cards
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {cards.map((c) => {
                  const code = extractCleanCardCode(c);
                  const qty = bulkQuantities[code] || 4;
                  const isLeader = (c.category || '').toLowerCase() === 'leader';

                  return (
                    <div
                      key={c.id || code}
                      className="p-2 rounded-xl bg-[#181b26] border border-[#262c3d] flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 aspect-[2.5/3.5] rounded bg-black/40 border border-white/10 shrink-0 overflow-hidden">
                          <img
                            src={getSafeCardImageUrl(c.imageUrl, c.id || c.cardNumber)}
                            alt={c.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => handleCardImageError(e, c.id || c.cardNumber, c.imageUrl)}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-blue-400">
                              {code}
                            </span>
                            {isLeader && (
                              <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/20 px-1 rounded">
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-white truncate max-w-[170px] sm:max-w-[220px]">
                            {c.name}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Stepper for each card */}
                      <div className="flex items-center rounded-lg bg-[#10121a] border border-[#2b3245] overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setBulkQuantities((prev) => ({
                              ...prev,
                              [code]: Math.max(1, (prev[code] || 4) - 1),
                            }));
                          }}
                          className="px-2 py-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-white text-xs">
                          {qty}x
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkQuantities((prev) => ({
                              ...prev,
                              [code]: Math.min(4, (prev[code] || 4) + 1),
                            }));
                          }}
                          className="px-2 py-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-5 py-3.5 border-t border-[#222533] bg-[#10121a] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>
              {isCreatingNew
                ? `Create Deck & Add ${addingCount > 0 ? `(${addingCount} Cards)` : ''}`
                : `Add to ${activeDeck?.name || 'Deck'} ${addingCount > 0 ? `(+${addingCount})` : ''}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
