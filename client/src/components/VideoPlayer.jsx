import { useEffect, useState, useRef, useCallback } from 'react';
import { ROOM_STATUS } from '../lib/constants';
import { formatTime } from '../lib/utils';

const ASPECT_RATIOS = [
  { label: 'Auto',  fit: 'contain', ar: null },
  { label: '16:9',  fit: 'contain', ar: 16/9 },
  { label: '4:3',   fit: 'contain', ar: 4/3 },
  { label: '21:9',  fit: 'contain', ar: 21/9 },
  { label: '1:1',   fit: 'contain', ar: 1 },
  { label: 'Fill',  fit: 'cover',   ar: null },
];

export default function VideoPlayer({ videoRef, blobUrl, status, hashMatch, onSelectDifferentFile, customControls }) {
  const [isPlaying, setIsPlaying]         = useState(false);
  const [currentTime, setCurrentTime]     = useState(0);
  const [duration, setDuration]           = useState(0);
  const [volume, setVolume]               = useState(1);
  const [showControls, setShowControls]   = useState(true);
  const [playbackRate, setPlaybackRate]   = useState(1);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [showAspectMenu, setShowAspectMenu] = useState(false);
  const [skipEffect, setSkipEffect]       = useState(null);
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  // Subtitle state
  const [textTracks, setTextTracks]       = useState([]);
  const [activeTrack, setActiveTrack]     = useState(-1); // -1 = off
  const [showSubMenu, setShowSubMenu]     = useState(false);

  const controlsTimeoutRef  = useRef(null);
  const lastTapRef          = useRef(0);
  const longPressRef        = useRef(null);
  const origRateRef         = useRef(1);
  const isPlayingRef        = useRef(false);
  const containerRef        = useRef(null);

  /* ── video events ── */
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onTime    = () => setCurrentTime(v.currentTime);
    const onDur     = () => setDuration(v.duration);
    const onPlay    = () => { setIsPlaying(true);  isPlayingRef.current = true; };
    const onPause   = () => { setIsPlaying(false); isPlayingRef.current = false; };
    const onRate    = () => setPlaybackRate(v.playbackRate);
    const onLoaded  = () => {
      const tracks = Array.from(v.textTracks || []);
      setTextTracks(tracks.map((t, i) => ({ label: t.label || `Track ${i+1}`, kind: t.kind, index: i })));
      // disable all by default
      for (let t of v.textTracks) t.mode = 'disabled';
      setActiveTrack(-1);
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('durationchange', onDur);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ratechange', onRate);
    v.addEventListener('loadedmetadata', onLoaded);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('durationchange', onDur);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ratechange', onRate);
      v.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [videoRef]);

  /* ── fullscreen ── */
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  /* ── hard block ── */
  useEffect(() => {
    if (status !== ROOM_STATUS.SYNCED && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause(); setIsPlaying(false); isPlayingRef.current = false;
    }
  }, [status, videoRef]);

  /* ── close menus on outside click ── */
  useEffect(() => {
    const h = () => { setShowAspectMenu(false); setShowSubMenu(false); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, []);

  const handleNativePlay = e => {
    if (status !== ROOM_STATUS.SYNCED) { e.preventDefault(); videoRef.current.pause(); }
  };
  const togglePlay = () => {
    if (status !== ROOM_STATUS.SYNCED) return;
    videoRef.current.paused ? videoRef.current.play().catch(console.error) : videoRef.current.pause();
  };
  const handleSeek  = e => { if (status !== ROOM_STATUS.SYNCED) return; videoRef.current.currentTime = parseFloat(e.target.value); };
  const skipTime    = n => { if (status !== ROOM_STATUS.SYNCED || !videoRef.current) return; videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + n, 0), duration); };
  const handleVolume = e => { const v = parseFloat(e.target.value); setVolume(v); videoRef.current.volume = v; };
  const changeSpeed  = r => { if (status !== ROOM_STATUS.SYNCED || !videoRef.current) return; videoRef.current.playbackRate = r; };

  /* ── subtitle toggle ── */
  const selectTrack = idx => {
    const v = videoRef.current; if (!v) return;
    for (let i = 0; i < v.textTracks.length; i++) {
      v.textTracks[i].mode = i === idx ? 'showing' : 'disabled';
    }
    setActiveTrack(idx);
    setShowSubMenu(false);
  };
  const disableSubs = () => {
    const v = videoRef.current; if (!v) return;
    for (let t of v.textTracks) t.mode = 'disabled';
    setActiveTrack(-1); setShowSubMenu(false);
  };

  /* ── auto-hide controls ── */
  const scheduleHide = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => { if (isPlayingRef.current) setShowControls(false); }, 3000);
  }, []);
  const handleInteraction = useCallback(() => { setShowControls(true); scheduleHide(); }, [scheduleHide]);
  useEffect(() => {
    if (isPlaying) { scheduleHide(); }
    else { setShowControls(true); clearTimeout(controlsTimeoutRef.current); }
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [isPlaying, scheduleHide]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current.requestFullscreen().catch(console.error);
  };

  /* ── gestures ── */
  const handlePointerDown = e => {
    if (status !== ROOM_STATUS.SYNCED || e.target.closest('.controls-bar')) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      const { left, width } = e.currentTarget.getBoundingClientRect();
      const fwd = e.clientX - left > width / 2;
      skipTime(fwd ? 10 : -10);
      setSkipEffect({ type: fwd ? 'forward' : 'backward', triggerId: now });
      lastTapRef.current = 0;
      clearTimeout(longPressRef.current); return;
    }
    lastTapRef.current = now;
    origRateRef.current = videoRef.current.playbackRate;
    longPressRef.current = setTimeout(() => { if (videoRef.current) videoRef.current.playbackRate = 2; }, 500);
  };
  const handlePointerUp = () => {
    clearTimeout(longPressRef.current); longPressRef.current = null;
    if (videoRef.current && videoRef.current.playbackRate === 2 && origRateRef.current !== 2)
      videoRef.current.playbackRate = origRateRef.current;
  };

  /* ── aspect ratio: compute video style ── */
  const getVideoStyle = () => {
    const { fit, ar } = selectedRatio;
    if (!ar) return { width: '100%', height: '100%', objectFit: fit };
    // Letterbox/pillarbox: constrain to whichever axis is limiting
    return { maxWidth: '100%', maxHeight: '100%', aspectRatio: `${ar}`, objectFit: fit, width: 'auto', height: 'auto' };
  };

  let overlayMessage = null;
  if (status !== ROOM_STATUS.SYNCED) {
    if (status === ROOM_STATUS.WAITING)        overlayMessage = 'Waiting for your co-watcher to join...';
    else if (status === ROOM_STATUS.DISCONNECTED) overlayMessage = 'Peer disconnected. Waiting for them to rejoin...';
    else if (hashMatch === false)              overlayMessage = 'File mismatch. Please select the exact same file.';
    else                                       overlayMessage = 'Syncing and verifying both video files...';
  }

  const controlsVisible = showControls || !isPlaying;

  return (
    <div
      ref={containerRef}
      className={`video-container relative w-full h-full flex flex-col bg-black overflow-hidden select-none ${!controlsVisible ? 'cursor-none' : ''}`}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Status badge */}
      {overlayMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-xl text-white/90 px-6 py-3 rounded-2xl text-sm font-semibold border border-white/10 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-sv-accent animate-pulse" />
            {overlayMessage}
          </div>
          {hashMatch === false && (
            <button onClick={onSelectDifferentFile} className="pointer-events-auto px-6 py-2.5 bg-sv-red/90 hover:bg-sv-red text-white text-sm font-bold rounded-xl transition-colors">
              Select Different File
            </button>
          )}
        </div>
      )}

      {/* Video */}
      <div className="flex-1 flex items-center justify-center relative w-full h-full">
        {status !== ROOM_STATUS.SYNCED && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md" />
        )}
        <video
          ref={videoRef}
          src={blobUrl}
          playsInline preload="metadata"
          style={getVideoStyle()}
          className={`transition-all duration-300 ${status !== ROOM_STATUS.SYNCED ? 'pointer-events-none opacity-50' : ''}`}
          onClick={togglePlay}
          onPlay={handleNativePlay}
        />
      </div>

      {/* 2x speed badge */}
      <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-40 bg-black/50 backdrop-blur-xl border border-white/10 text-white px-6 py-3 rounded-full font-extrabold tracking-widest flex items-center gap-2 transition-all duration-300 ${playbackRate === 2 && isPlaying ? 'opacity-100 scale-100 animate-pulse' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <svg className="w-5 h-5 text-sv-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
        2X SPEED
      </div>

      {/* Skip effect */}
      {skipEffect && (
        <div key={skipEffect.triggerId} className={`absolute inset-y-0 w-1/3 flex items-center justify-center pointer-events-none z-30 animate-[fadeOut_0.6s_ease-out_forwards] ${skipEffect.type === 'forward' ? 'right-0' : 'left-0'}`}>
          <div className="bg-black/30 backdrop-blur-lg border border-white/5 rounded-full w-28 h-28 flex flex-col items-center justify-center text-white">
            <svg className="w-10 h-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {skipEffect.type === 'forward'
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />}
            </svg>
            <span className="font-extrabold text-sm">{skipEffect.type === 'forward' ? '+10s' : '-10s'}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      {status === ROOM_STATUS.SYNCED && (
        <div
          className={`controls-bar absolute bottom-6 left-6 right-6 z-50 transition-all duration-500 ease-out ${controlsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] rounded-3xl p-5 flex flex-col gap-4">
            {/* Timeline */}
            <div className="relative flex items-center cursor-pointer py-2 -my-2"
              onMouseEnter={() => setIsHoveringTimeline(true)}
              onMouseLeave={() => setIsHoveringTimeline(false)}>
              <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 touch-none" />
              <div className={`w-full bg-white/20 rounded-full pointer-events-none transition-all duration-200 ${isHoveringTimeline ? 'h-2' : 'h-1'}`}>
                <div className="h-full bg-sv-accent rounded-full relative" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg translate-x-1/2 transition-transform ${isHoveringTimeline ? 'scale-100' : 'scale-0'}`} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-white/90">
              {/* Left */}
              <div className="flex items-center gap-4 lg:gap-5">
                <button onClick={togglePlay} className="hover:text-white hover:scale-110 transition-all focus:outline-none">
                  {isPlaying
                    ? <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                </button>
                <button onClick={() => skipTime(-10)} className="text-white/60 hover:text-white hover:scale-110 transition-all hidden sm:block focus:outline-none">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
                </button>
                <button onClick={() => skipTime(10)} className="text-white/60 hover:text-white hover:scale-110 transition-all hidden sm:block focus:outline-none">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" /></svg>
                </button>
                <div className="text-sm font-medium text-white/70 tabular-nums hidden md:block">
                  {formatTime(currentTime)} <span className="opacity-40 mx-1">/</span> {formatTime(duration)}
                </div>
                {customControls && (
                  <div className="h-4 w-px bg-white/20 mx-2 hidden md:block"></div>
                )}
                {customControls}
              </div>

              {/* Right */}
              <div className="flex items-center gap-4 lg:gap-5">
                {/* Volume */}
                <div className="hidden lg:flex items-center gap-2">
                  <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2l5 5V5L7 10H5z" />
                  </svg>
                  <input type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolume}
                    className="w-20 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" />
                </div>

                {/* Speed */}
                <div className="relative group/speed">
                  <button className="text-sm font-bold text-white/80 hover:text-white transition-colors">{playbackRate}x</button>
                  <div className="absolute bottom-[calc(100%+16px)] right-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden opacity-0 invisible group-hover/speed:opacity-100 group-hover/speed:visible transition-all flex flex-col min-w-[90px]">
                    {[0.5,1,1.25,1.5,2].map(r => (
                      <button key={r} onClick={() => changeSpeed(r)} className={`px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors ${playbackRate===r?'text-sv-accent font-extrabold':'text-white/80'}`}>{r}x</button>
                    ))}
                  </div>
                </div>

                {/* Subtitles */}
                <div className="relative hidden sm:block" onPointerDown={e => e.stopPropagation()}>
                  <button
                    onClick={() => { setShowSubMenu(p => !p); setShowAspectMenu(false); }}
                    title="Subtitles"
                    className={`flex items-center gap-1 hover:scale-110 transition-all focus:outline-none ${activeTrack >= 0 ? 'text-sv-accent' : 'text-white/60 hover:text-white'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h10M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    {activeTrack >= 0 && <span className="text-xs font-bold">CC</span>}
                  </button>
                  {showSubMenu && (
                    <div className="absolute bottom-[calc(100%+16px)] right-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col min-w-[140px] z-50">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Subtitles</p>
                      </div>
                      <button onClick={disableSubs} className={`px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors flex items-center justify-between ${activeTrack===-1?'text-sv-accent font-bold':'text-white/80'}`}>
                        Off {activeTrack===-1 && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                      </button>
                      {textTracks.length === 0 && (
                        <p className="px-4 py-2.5 text-xs text-white/30 italic">No tracks in file</p>
                      )}
                      {textTracks.map(t => (
                        <button key={t.index} onClick={() => selectTrack(t.index)} className={`px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors flex items-center justify-between gap-2 ${activeTrack===t.index?'text-sv-accent font-bold':'text-white/80'}`}>
                          <span>{t.label}</span>
                          {activeTrack===t.index && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Aspect Ratio */}
                <div className="relative hidden sm:block" onPointerDown={e => e.stopPropagation()}>
                  <button
                    onClick={() => { setShowAspectMenu(p => !p); setShowSubMenu(false); }}
                    title="Aspect Ratio"
                    className="text-white/60 hover:text-white hover:scale-110 transition-all focus:outline-none flex items-center gap-1"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={2}/>
                      <path d="M3 9h18M9 19V9" strokeWidth={1.5} strokeLinecap="round"/>
                    </svg>
                    <span className="text-xs font-bold text-white/50">{selectedRatio.label}</span>
                  </button>
                  {showAspectMenu && (
                    <div className="absolute bottom-[calc(100%+16px)] right-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col min-w-[110px] z-50">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Ratio</p>
                      </div>
                      {ASPECT_RATIOS.map(r => (
                        <button key={r.label} onClick={() => { setSelectedRatio(r); setShowAspectMenu(false); }}
                          className={`px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors flex items-center justify-between gap-2 ${selectedRatio.label===r.label?'text-sv-accent font-bold':'text-white/80'}`}>
                          {r.label}
                          {selectedRatio.label===r.label && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="text-white/60 hover:text-white hover:scale-110 transition-all focus:outline-none">
                  {isFullscreen
                    ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0h4M4 4v4m11 1l5-5m0 0h-4m4 0v4M9 15l-5 5m0 0h4m-4 0v-4m11-1l5 5m0 0h-4m4 0v-4"/></svg>
                    : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
