import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { generateRoomCode } from '../lib/utils';
import socket from '../lib/socket';

// ─── Feature Pill ─────────────────────────────────────────────────────────────
function FeaturePill({ icon, text, colorClass }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-white/60 border border-sv-border/60 rounded-full px-4 py-2 backdrop-blur-md text-sv-text text-sm font-semibold hover:shadow-md transition-all duration-300 select-none ${colorClass}`}>
      {icon}
      {text}
    </div>
  );
}

// ─── Main Landing Component ───────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setRoomCode, setIsHost, setMyName } = useRoom();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [joinCode, setJoinCode] = useState(searchParams.get('code') || '');
  const [joinError, setJoinError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    socket.connect();
    const errParam = searchParams.get('error');
    if (errParam === 'host_closed') {
      setSystemMessage('The host has closed the room. You have been disconnected.');
      window.history.replaceState({}, '', '/');
    }
    return () => { };
  }, [searchParams]);

  const validateName = () => {
    if (!name.trim()) {
      setNameError('Please enter your name first.');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreateRoom = () => {
    if (!validateName()) return;
    setIsCreating(true);
    const code = generateRoomCode();
    const trimmedName = name.trim();
    setRoomCode(code);
    setIsHost(true);
    setMyName(trimmedName);
    sessionStorage.setItem('sp_session', JSON.stringify({ roomCode: code, isHost: true, myName: trimmedName }));
    socket.emit('create-room', { roomCode: code, name: trimmedName });
    navigate(`/room/${code}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!validateName()) return;
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError('Room code must be 6 characters.');
      return;
    }
    const trimmedName = name.trim();
    setRoomCode(code);
    setIsHost(false);
    setMyName(trimmedName);
    sessionStorage.setItem('sp_session', JSON.stringify({ roomCode: code, isHost: false, myName: trimmedName }));
    navigate(`/room/${code}`);
  };

  const nameMissing = !name.trim();

  return (
    <div className="min-h-screen bg-sv-bg flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* ── Ultra-Professional Dark Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#09090b]">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        {/* Elegant deep glows */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* ── Top nav bar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sv-accent to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-sv-accent/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-white font-black text-xl tracking-tight">SaashPlay</span>
        </div>
        <div className="flex items-center gap-2 bg-[#18181b]/80 border border-white/10 backdrop-blur-xl rounded-full px-4 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">Zero Latency P2P</span>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="w-full max-w-6xl z-10 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24 pt-16">

        {/* ── Left: Hero ── */}
        <div
          className={`flex-1 text-center lg:text-left transition-all duration-1000 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
            <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Private Co-Watching</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
            Watch Together,<br />
            <span className="relative inline-block mt-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                Anywhere.
              </span>
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg lg:text-xl text-gray-300 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10">
            Frame-perfect sync. Crystal-clear voice. Fully private, peer-to-peer.
            <br className="hidden md:block" />
            <span className="text-gray-500">No servers storing your videos. Ever.</span>
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-12">
            <FeaturePill
              icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>}
              text="End-to-End P2P"
              colorClass="hover:text-sv-accent hover:border-sv-accent/30"
            />
            <FeaturePill
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              text="Frame-Perfect Sync"
              colorClass="hover:text-purple-500 hover:border-purple-500/30"
            />
            <FeaturePill
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
              text="Voice Chat"
              colorClass="hover:text-pink-500 hover:border-pink-500/30"
            />
            <FeaturePill
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
              text="Live Chat"
              colorClass="hover:text-emerald-500 hover:border-emerald-500/30"
            />
          </div>

          {/* System message (host closed room) */}
          {systemMessage && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 flex items-start gap-3 shadow-sm max-w-lg mx-auto lg:mx-0 mb-8">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm font-medium">{systemMessage}</div>
            </div>
          )}
        </div>

        {/* ── Right: Premium Entry Card ── */}
        <div className={`w-full max-w-[400px] relative transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="bg-[#18181b]/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] rounded-3xl relative z-10 p-8 border-2 border-indigo-500/30">

            {/* Name Field */}
            <div className="mb-6">
              <label htmlFor="name-input" className="block text-indigo-300 text-[11px] font-bold uppercase tracking-[0.2em] mb-2.5">
                Your Name
              </label>
              <div className="relative">
                <input
                  id="name-input"
                  type="text"
                  placeholder="Enter your name..."
                  value={name}
                  onChange={e => { setName(e.target.value); setNameError(''); }}
                  maxLength={24}
                  className={`w-full bg-black/40 border-2 ${nameError ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-500/20'} rounded-2xl py-3.5 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 text-sm font-semibold`}
                />
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${name.trim() ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white/5 text-gray-500'}`}>
                  {name.trim() ? name.trim().charAt(0).toUpperCase() : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </div>
              {nameError && (
                <p className="text-red-400 text-[11px] mt-2 flex items-center gap-1 font-semibold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {nameError}
                </p>
              )}
            </div>

            {/* Create Room — Primary CTA */}
            <button
              id="create-room-btn"
              onClick={handleCreateRoom}
              disabled={isCreating || nameMissing}
              className="group relative w-full rounded-2xl py-4 mb-8 font-bold text-[14px] text-white overflow-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] focus:outline-none bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 border border-indigo-400/50"
            >
              <span className="relative flex items-center justify-center gap-2.5 tracking-wide">
                {isCreating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Room
                  </>
                )}
              </span>
            </button>

            {/* OR divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase">or join existing</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            {/* Join Room */}
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input
                id="join-code-input"
                type="text"
                placeholder="R O O M   C O D E"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                maxLength={6}
                className={`w-full bg-black/40 border-2 ${joinError ? 'border-red-400 focus:ring-red-500/20' : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-500/20'} rounded-2xl py-3.5 px-4 text-center text-sm tracking-[0.4em] uppercase text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 font-bold`}
              />
              {joinError && <p className="text-red-400 text-[11px] text-center font-semibold">{joinError}</p>}

              <button
                id="join-room-btn"
                type="submit"
                disabled={joinCode.length < 6 || nameMissing}
                className="group relative w-full rounded-2xl py-4 font-bold text-[14px] text-indigo-300 bg-white/5 border-2 border-white/10 shadow-sm overflow-hidden transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-400/50 hover:text-white hover:bg-white/10 active:scale-[0.98] focus:outline-none"
              >
                <span className="flex items-center justify-center gap-2.5 tracking-wide">
                  <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Join Room
                </span>
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* ── Bottom Footer ── */}
      <div className={`absolute bottom-6 left-0 right-0 flex justify-center z-10 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-sv-muted text-xs font-medium tracking-wide">
          SaashPlay © {new Date().getFullYear()} — No servers, no logs, no limits.
        </p>
      </div>
    </div>
  );
}
