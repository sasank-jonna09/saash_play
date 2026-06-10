export default function VoiceControls({ isMuted, isVoiceActive, onToggleMute, onStartVoice, hasStarted, isVideoEnabled, onToggleVideo }) {
  if (!hasStarted) {
    return (
      <div className="flex gap-2">
        <button 
          onClick={() => onStartVoice(false)}
          className="px-4 py-2 text-xs font-bold bg-white hover:bg-sv-card border border-sv-border text-sv-text rounded-xl transition-colors touch-manipulation shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-sv-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Join Voice
        </button>
        <button 
          onClick={() => onStartVoice(true)}
          className="px-4 py-2 text-xs font-bold bg-white hover:bg-sv-card border border-sv-border text-sv-text rounded-xl transition-colors touch-manipulation shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Join Video
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Mic Toggle */}
      <button
        onClick={onToggleMute}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-sm touch-manipulation
          ${isMuted ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'bg-white border-sv-border text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'}
        `}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {!isMuted && isVoiceActive && (
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400 opacity-60 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        )}
        
        {isMuted ? (
          <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Video Toggle */}
      <button
        onClick={onToggleVideo}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-sm touch-manipulation
          ${!isVideoEnabled ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'bg-white border-sv-border text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'}
        `}
        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {!isVideoEnabled ? (
          <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
