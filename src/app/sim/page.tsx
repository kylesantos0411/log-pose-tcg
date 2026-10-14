'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';
import { RECOMMENDED_DECKS, getDeckById, RecommendedDeck } from '@/lib/recommended-decks';
import { SimPlaymat } from '@/components/sim/SimPlaymat';
import { SimMultiplayerModal } from '@/components/sim/SimMultiplayerModal';
import { 
  Gamepad2, 
  ArrowLeft, 
  ChevronRight, 
  BookOpen, 
  Swords, 
  Search,
  Users,
  Radio,
  Lock
} from 'lucide-react';
import { 
  checkCanAccessSim, 
  checkIsAdmin, 
  fetchSystemSettings, 
  updateSystemSetting,
  DEFAULT_SYSTEM_SETTINGS, 
  type SystemSettingsState 
} from '@/lib/supabase-sync';
import { getActiveSession } from '@/lib/user-accounts';
import { getEditionCardImageUrl, handleCardImageError } from '@/lib/card-image';
import { ST01_STRAW_HAT_DECK } from '@/lib/sim/starter-decks';

function SimulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettingsState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('logpose_system_settings_cache');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return DEFAULT_SYSTEM_SETTINGS;
  });

  useEffect(() => {
    setMounted(true);
    fetchSystemSettings().then(setSystemSettings);
    const handleUpdate = () => fetchSystemSettings().then(setSystemSettings);
    window.addEventListener('logpose_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('logpose_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const sessionUser = user || (typeof window !== 'undefined' ? getActiveSession() : null);
  const isAdmin = checkIsAdmin(sessionUser);
  const isSimLocked = Boolean(systemSettings.features?.sim?.locked);
  const isLockedForCurrentUser = isSimLocked && (!isAdmin || !adminBypass);

  const handleUnlockSim = async () => {
    const updatedFeatures = {
      ...(systemSettings.features || {}),
      sim: {
        locked: false,
        message: '',
      },
    };
    await updateSystemSetting('features', updatedFeatures, user?.tag);
    setSystemSettings((prev) => ({
      ...prev,
      features: updatedFeatures,
    }));
  };

  const deckId = searchParams.get('deckId');
  const tutorialParam = searchParams.get('tutorial');

  const [selectedDeck, setSelectedDeck] = useState<RecommendedDeck | null>(() => {
    if (deckId) {
      return getDeckById(deckId) || null;
    }
    if (tutorialParam === 'true') {
      return ST01_STRAW_HAT_DECK;
    }
    return null;
  });

  const [isTutorialEnabled, setIsTutorialEnabled] = useState<boolean>(() => {
    return tutorialParam === 'true';
  });

  const [multiplayerRoom, setMultiplayerRoom] = useState<{ roomId: string; isHost: boolean } | null>(null);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);
  const [deckForMultiplayer, setDeckForMultiplayer] = useState<RecommendedDeck>(ST01_STRAW_HAT_DECK);
  const [deckSearch, setDeckSearch] = useState('');

  // If a custom deck was launched from /decks via deckId, load it from localStorage
  useEffect(() => {
    if (deckId && !selectedDeck) {
      try {
        const stored = localStorage.getItem('optcg_custom_decks');
        if (stored) {
          const parsed: RecommendedDeck[] = JSON.parse(stored);
          const match = parsed.find((d) => d.id === deckId);
          if (match) setSelectedDeck(match);
        }
      } catch (e) {
        console.error('Failed to load custom deck from localStorage', e);
      }
    }
  }, [deckId, selectedDeck]);

  // 1. Loading & Authorization Guards
  if (!mounted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Gamepad2 className="w-5 h-5 text-amber-400 animate-pulse" />
          <span>Loading TCG Simulator...</span>
        </div>
      </div>
    );
  }

  if (isLockedForCurrentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#141824] border border-[#252b3d] rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white">Simulator Temporarily Paused</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {systemSettings.features?.sim?.message ||
                'The One Piece TCG Simulator is temporarily paused for updates, balancing, or scheduled maintenance.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/decks"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse Decks</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e2332] hover:bg-[#282f44] border border-[#2e374f] text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Admin Command Bypass Controls */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-[#252a3b] space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Admin Controls
              </span>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setAdminBypass(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition cursor-pointer"
                >
                  Preview as Admin (Bypass)
                </button>
                <button
                  type="button"
                  onClick={handleUnlockSim}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  ⚡ Set Simulator LIVE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. IF A DECK IS SELECTED -> RENDER PLAYMAT
  if (selectedDeck) {
    return (
      <SimPlaymat
        initialDeck={selectedDeck}
        initialTutorialMode={isTutorialEnabled}
        initialMultiplayerRoom={multiplayerRoom || undefined}
        onExit={() => {
          setSelectedDeck(null);
          setMultiplayerRoom(null);
          setIsTutorialEnabled(false);
          router.push('/sim');
        }}
      />
    );
  }

  // Filter meta tournament decks by search
  const filteredDecks = RECOMMENDED_DECKS.filter((d) => {
    if (!deckSearch.trim()) return true;
    const q = deckSearch.toLowerCase().trim();
    return (
      d.name.toLowerCase().includes(q) ||
      d.leaderName.toLowerCase().includes(q) ||
      d.leaderId.toLowerCase().includes(q)
    );
  });

  const handleOpenMultiplayer = (deck?: RecommendedDeck) => {
    if (deck) {
      setDeckForMultiplayer(deck);
    }
    setShowMultiplayerModal(true);
  };

  const handleLaunchMultiplayerRoom = (roomId: string, isHost: boolean, chosenDeck?: RecommendedDeck) => {
    const finalDeck = chosenDeck || deckForMultiplayer || ST01_STRAW_HAT_DECK;
    setIsTutorialEnabled(false);
    setMultiplayerRoom({ roomId, isHost });
    setSelectedDeck(finalDeck);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20 space-y-5 min-h-screen">
      {/* Admin Bypass Notice when Sim is Locked */}
      {isSimLocked && isAdmin && adminBypass && (
        <div className="p-3 px-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>⚠️ <b>ADMIN PREVIEW MODE:</b> Simulator is locked for public users. You are previewing in Admin Bypass mode.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminBypass(false)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-semibold text-amber-200 transition cursor-pointer"
            >
              Exit Preview
            </button>
            <Link href="/admin" className="underline font-bold hover:text-white shrink-0 ml-1">
              Admin Switchboard &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222736]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1e2332] text-slate-200 border border-[#2f374e] flex items-center justify-center shadow-sm">
              <Gamepad2 className="w-4.5 h-4.5 text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  TCG Simulator
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#1b2536] text-slate-300 text-[10px] font-semibold border border-slate-700/60">
                  PLAYTEST
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Practice tournament decks, test hands, curves, or battle live 2-player PVP.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/decks"
          className="px-3 py-1.5 rounded-xl bg-[#1a1e2b] hover:bg-[#23283a] text-xs font-medium text-slate-300 flex items-center gap-1.5 self-start sm:self-auto border border-[#2c3349] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Deck Archive</span>
        </Link>
      </div>

      {/* Game Mode Selector - 3 Modes: Tutorial, Sandbox Solo, Online PVP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Interactive Tutorial Mode */}
        <div
          onClick={() => {
            setIsTutorialEnabled(true);
            setSelectedDeck(ST01_STRAW_HAT_DECK);
          }}
          className="p-4 rounded-xl bg-[#141824] border border-[#252b3d] hover:border-slate-500 shadow-md cursor-pointer flex flex-col justify-between gap-3 transition group"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1c2234] border border-[#2d364f] flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Guided Tutorial
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 font-medium">
                  Beginner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Step-by-step walkthrough covering turn phases, DON!! allocation, attack targets, blockers, and triggers.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1e2435]">
            <span className="text-[11px] text-slate-400 font-medium">Straw Hat vs Kaido</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:text-blue-300">
              <span>Start Tutorial</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 2: Regular Solitaire Sandbox (Tutorial OFF) */}
        <div
          onClick={() => {
            setIsTutorialEnabled(false);
            setSelectedDeck(ST01_STRAW_HAT_DECK);
          }}
          className="p-4 rounded-xl bg-[#141824] border border-[#252b3d] hover:border-slate-500 shadow-md cursor-pointer flex flex-col justify-between gap-3 transition group"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1c2234] border border-[#2d364f] flex items-center justify-center shrink-0">
              <Swords className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Sandbox Practice
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 font-medium">
                  Solo AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Full board freedom with reactive practice opponent. Test mulligans, curves, counters, and automated searchers.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1e2435]">
            <span className="text-[11px] text-slate-400 font-medium">Solitaire Testing</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:text-amber-300">
              <span>Play Sandbox</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 3: Online PVP Match (2-Player Live) */}
        <div
          onClick={() => handleOpenMultiplayer(ST01_STRAW_HAT_DECK)}
          className="p-4 rounded-xl bg-[#141824] border border-[#252b3d] hover:border-indigo-500/70 shadow-md cursor-pointer flex flex-col justify-between gap-3 transition group relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Online PVP Match
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-medium flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  <span>2-Player</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Battle a friend in real-time. Secret private hands, peer turn passing, and synchronized blocker / counter combat.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1e2435]">
            <span className="text-[11px] text-slate-400 font-medium">Host or Join Room</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
              <span>PVP Lobby</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={deckSearch}
          onChange={(e) => setDeckSearch(e.target.value)}
          placeholder="Search decks by name or leader (e.g. Zoro, Law, Enel, Katakuri)..."
          className="w-full bg-[#141824] border border-[#252b3d] focus:border-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
        />
      </div>

      {/* Meta Tournament Decks */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase">
          Standard &amp; Meta Decks ({filteredDecks.length})
        </h2>

        {/* Grid of Decks to test */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              className="group p-3 rounded-xl bg-[#141824] border border-[#23293a] hover:border-slate-500 shadow-sm transition-all flex items-center gap-3 relative"
            >
              {/* Leader thumbnail */}
              <div 
                onClick={() => setSelectedDeck(deck)}
                className="w-13 sm:w-14 aspect-[2.5/3.5] rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 cursor-pointer"
              >
                <img
                  src={getEditionCardImageUrl(deck.leaderId, 'jp', deck.leaderImage)}
                  alt={deck.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleCardImageError(e, deck.leaderId, deck.leaderImage)}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div 
                  onClick={() => setSelectedDeck(deck)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-medium text-slate-400">
                      {deck.leaderId}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800 text-slate-300">
                      {deck.rank}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate mt-0.5">
                    {deck.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    {deck.subname}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#1e2435]">
                  {/* Action buttons: Solo Playtest & Online PVP */}
                  <button
                    type="button"
                    onClick={() => setSelectedDeck(deck)}
                    className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer"
                  >
                    <span>Playtest</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenMultiplayer(deck)}
                    className="px-2 py-0.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/40 text-[10px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                    title="Launch Online PVP with this deck"
                  >
                    <Users className="w-3 h-3 text-indigo-400" />
                    <span>PVP</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-Battle Online Multiplayer Modal */}
      <SimMultiplayerModal
        isOpen={showMultiplayerModal}
        onClose={() => setShowMultiplayerModal(false)}
        onJoinRoom={handleLaunchMultiplayerRoom}
        currentDeck={deckForMultiplayer}
      />
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-xs text-gray-400">
          Loading TCG Simulator...
        </div>
      }
    >
      <SimulatorContent />
    </Suspense>
  );
}
