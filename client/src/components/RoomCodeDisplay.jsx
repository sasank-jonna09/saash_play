import { useState } from 'react';
import { copyToClipboard } from '../lib/utils';

export default function RoomCodeDisplay({ roomCode, inviteLink, myName, peerName, isHost }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = async () => {
    if (await copyToClipboard(roomCode)) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (await copyToClipboard(inviteLink)) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!roomCode) return null;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#18181b]/80 backdrop-blur-xl p-6 md:p-8 border-2 border-indigo-500/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col md:flex-row gap-8 items-center justify-between">
      
      {/* Graphic Elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
      
      {/* ── Left: Room Access ── */}
      <div className="flex-1 w-full flex flex-col gap-4 relative z-10">
        <h3 className="text-indigo-300 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-pulse" />
          Room Access
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="bg-black/40 flex-1 px-5 py-3.5 rounded-2xl border border-white/10 font-mono text-2xl tracking-[0.3em] text-white font-black text-center shadow-inner">
            {roomCode}
          </div>
          <button 
            onClick={handleCopyCode}
            className="p-4 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 transition-colors text-indigo-300 touch-manipulation shadow-sm"
            title="Copy Room Code"
          >
            {copiedCode ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        
        <button 
          onClick={handleCopyLink}
          className="w-full py-3 text-[13px] font-bold bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-400/50 text-indigo-300 rounded-xl transition-all touch-manipulation shadow-sm flex items-center justify-center gap-2"
        >
          {copiedLink ? (
            <>
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              <span className="text-emerald-400">Copied Link!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Copy Invite Link
            </>
          )}
        </button>
      </div>

      {/* ── Right: Members List ── */}
      <div className="flex-1 w-full bg-black/20 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex flex-col gap-4 relative z-10">
        <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Active Members</h3>
        
        <div className="flex flex-col gap-3">
          
          {/* My Name */}
          <div className="flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold flex items-center justify-center text-xs">
                {myName ? myName.charAt(0).toUpperCase() : 'Y'}
              </div>
              <span className="font-bold text-gray-200 text-sm">{myName || 'You'} (You)</span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${isHost ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
              {isHost ? 'Host' : 'Member'}
            </span>
          </div>

          {/* Peer Name */}
          <div className="flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs ${peerName ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                {peerName ? peerName.charAt(0).toUpperCase() : '?'}
              </div>
              <span className={`font-bold text-sm ${peerName ? 'text-gray-200' : 'text-gray-500'}`}>
                {peerName || 'Waiting...'}
              </span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${!isHost ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
              {!isHost ? 'Host' : 'Member'}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
