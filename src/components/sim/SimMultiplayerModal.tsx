'use client';

import React, { useState } from 'react';
import { Users, Copy, Check, Radio, Play, X } from 'lucide-react';
import { simMultiplayer } from '@/lib/sim/sim-multiplayer';

interface SimMultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string, isHost: boolean) => void;
}

export const SimMultiplayerModal: React.FC<SimMultiplayerModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreateRoom = () => {
    const generated = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCreatedRoomCode(generated);
  };

  const handleCopyCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartHosting = () => {
    if (createdRoomCode) {
      onJoinRoom(createdRoomCode, true);
      onClose();
    }
  };

  const handleJoinExisting = () => {
    if (roomCode.trim().length >= 4) {
      onJoinRoom(roomCode.trim().toUpperCase(), false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-black text-white text-base">Online Multiplayer Room</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Room Section */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Host a Room
            </span>
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </div>

          {!createdRoomCode ? (
            <button
              onClick={handleCreateRoom}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Generate Room Code</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-zinc-950 border border-indigo-500/50 rounded-xl px-3 py-2 text-indigo-300 font-mono font-bold text-sm">
                <span>{createdRoomCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Share this room code with your friend. When they join, the match begins!
              </p>
              <button
                onClick={handleStartHosting}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Enter Room & Wait for Player</span>
              </button>
            </div>
          )}
        </div>

        {/* Join Room Section */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-3">
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
            Join Friend&apos;s Room
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER ROOM CODE"
              maxLength={6}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-widest placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500"
            />
            <button
              onClick={handleJoinExisting}
              disabled={roomCode.trim().length < 4}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-xs transition"
            >
              Join
            </button>
          </div>
        </div>

        <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
          Powered by Supabase Realtime peer broadcast. Zero-latency card sync and official combat priority.
        </p>
      </div>
    </div>
  );
};
