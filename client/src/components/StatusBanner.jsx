import { ROOM_STATUS } from '../lib/constants';

const STEP_CONFIG = {
  uploading:        { color: 'text-amber-400',  dot: 'bg-amber-400 animate-pulse', label: 'Hashing your file...' },
  waitingPeer:      { color: 'text-indigo-400',  dot: 'bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.6)]', label: 'Waiting for peer to upload their file...' },
  verifying:        { color: 'text-amber-400',  dot: 'bg-amber-400 animate-pulse', label: 'Verifying files match...' },
  matched:          { color: 'text-emerald-400',   dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]', label: 'Files matched — synced & ready!' },
  mismatched:       { color: 'text-red-400',     dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]', label: 'File mismatch! Both users must use the exact same video file.' },
  waiting:          { color: 'text-gray-400',   dot: 'bg-red-400', label: 'Waiting for your co-watcher to join...' },
  disconnected:     { color: 'text-gray-400',   dot: 'bg-red-500', label: 'Peer disconnected. Waiting for them to rejoin...' },
};

export default function StatusBanner({ status, hashMatch, peerHash, myHash, isHashing, videoFile }) {
  let key = null;

  if (isHashing && videoFile)               key = 'uploading';
  else if (status === ROOM_STATUS.WAITING)  key = 'waiting';
  else if (peerHash && hashMatch === false) key = 'mismatched';
  else if (status === ROOM_STATUS.DISCONNECTED) key = 'disconnected';
  else if (status === ROOM_STATUS.VERIFYING) {
    if (myHash && !peerHash)                key = 'waitingPeer';
    else                                    key = 'verifying';
  }
  else if (status === ROOM_STATUS.SYNCED)   key = 'matched';

  if (!key) return null;

  const { color, dot, label } = STEP_CONFIG[key];
  const isSynced = key === 'matched';

  return (
    <div className={`border-b px-6 py-3 text-sm flex items-center justify-center gap-3 transition-colors duration-500 font-medium relative z-0 ${isSynced ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#09090b]/80 backdrop-blur-md border-white/10 shadow-sm'}`}>
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className={color}>{label}</span>
      {(key === 'uploading' || key === 'verifying') && (
        <svg className="w-4 h-4 animate-spin text-amber-400 ml-1" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {isSynced && (
        <svg className="w-5 h-5 text-emerald-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      )}
    </div>
  );
}
