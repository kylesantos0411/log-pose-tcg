'use client';

import React, { useState } from 'react';
import { Users, Copy, Check, Radio, Play, X, ChevronDown, ShieldCheck } from 'lucide-react';
import { RECOMMENDED_DECKS, RecommendedDeck } from '@/lib/recommended-decks';
import { getEditionCardImageUrl, handleCardImageError } from '@/lib/card-image';

interface SimMultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string, isHost: boolean, deck?: RecommendedDeck) => void;
  currentDeck?: RecommendedDeck;
}

export const SimMultiplayerModal: React.FC<SimMultiplayerModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
  currentDeck,
}) => {
  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string>(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  });
  const [copied, setCopied] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<RecommendedDeck>(
    currentDeck || RECOMMENDED_DECKS[0]
  );
  const [showDeckPicker, setShowDeckPicker] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartHosting = () => {
    if (createdRoomCode) {
      onJoinRoom(createdRoomCode, true, selectedDeck);
      onClose();
    }
  };

  const handleRegenerateCode = () => {
    setCreatedRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  const handleJoinExisting = () => {
    const clean = roomCode.trim().toUpperCase();
    if (clean.length >= 4) {
      onJoinRoom(clean, false, selectedDeck);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#141824] border border-[#252b3d] shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222736] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">Online PVP Match</h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-medium">
                  2-PLAYER
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Peer-to-peer real-time battle with secret hands and combat priority.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Deck Selector Bar */}
        <div className="rounded-xl border border-[#252b3d] bg-[#10141f] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Your Battle Deck
            </span>
            <button
              onClick={() => setShowDeckPicker(!showDeckPicker)}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
            >
              <span>{showDeckPicker ? 'Close Picker' : 'Change Deck'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showDeckPicker ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 aspect-[2.5/3.5] rounded-md overflow-hidden bg-black/40 border border-white/10 shrink-0">
              <img
                src={getEditionCardImageUrl(selectedDeck.leaderId, 'jp', selectedDeck.leaderImage)}
                alt={selectedDeck.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) =>
                  handleCardImageError(e, selectedDeck.leaderId, selectedDeck.leaderImage)
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">{selectedDeck.name}</h4>
              <p className="text-[10px] text-slate-400 truncate">
                {selectedDeck.leaderName} ({selectedDeck.leaderId})
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              50 Cards
            </span>
          </div>

          {/* Quick Deck Picker Dropdown */}
          {showDeckPicker && (
            <div className="pt-2 border-t border-[#1e2435] max-h-40 overflow-y-auto space-y-1 pr-1">
              {RECOMMENDED_DECKS.map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDeck(d);
                    setShowDeckPicker(false);
                  }}
                  className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                    selectedDeck.id === d.id
                      ? 'bg-indigo-950/70 border border-indigo-700/60 text-white font-semibold'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <span className="truncate">{d.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{d.leaderName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab Switcher: Host Room vs Join Room */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#10141f] border border-[#222736]">
          <button
            type="button"
            onClick={() => setActiveTab('host')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'host'
                ? 'bg-[#1e2435] text-white shadow-xs border border-slate-700/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Host Match</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-[#1e2435] text-white shadow-xs border border-slate-700/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Join Match</span>
          </button>
        </div>

        {/* TAB 1: HOST MATCH */}
        {activeTab === 'host' && (
          <div className="rounded-xl border border-[#252b3d] bg-[#10141f] p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Room Code</span>
                <span className="text-[10px] text-slate-400">Share with your friend to connect</span>
              </div>
              <button
                type="button"
                onClick={handleRegenerateCode}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline transition cursor-pointer"
              >
                Regenerate
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#141824] border border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-indigo-200 font-mono font-bold text-base tracking-widest">
              <span>{createdRoomCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300/90 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                As Host, you will take <strong>Turn 1</strong> (Going First with 1 active DON!!).
              </span>
            </div>

            <button
              type="button"
              onClick={handleStartHosting}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Room &amp; Wait for Player</span>
            </button>
          </div>
        )}

        {/* TAB 2: JOIN MATCH */}
        {activeTab === 'join' && (
          <div className="rounded-xl border border-[#252b3d] bg-[#10141f] p-4 space-y-3.5">
            <div>
              <span className="text-xs font-bold text-white block">Enter Room Code</span>
              <span className="text-[10px] text-slate-400">Ask your friend for their 6-character code</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. 8K2M9P"
                maxLength={8}
                className="flex-1 bg-[#141824] border border-[#252b3d] rounded-xl px-3.5 py-2.5 text-white text-sm font-mono tracking-widest placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleJoinExisting}
                disabled={roomCode.trim().length < 4}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs transition cursor-pointer"
              >
                Join Match
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300/90 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                As Guest, you will take <strong>Turn 2</strong> (Going Second with 2 active DON!!).
              </span>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
          Powered by Supabase Realtime peer broadcast. Hands stay hidden, turn changes and combat counters sync instantly.
        </p>
      </div>
    </div>
  );
};
