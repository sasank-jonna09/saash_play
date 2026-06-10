import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { usePeer } from '../hooks/usePeer';
import { useVideoSync } from '../hooks/useVideoSync';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { useFileHash } from '../hooks/useFileHash';
import { SYNC_EVENTS, ROOM_STATUS } from '../lib/constants';
import { buildInviteLink } from '../lib/utils';
import socket from '../lib/socket';

import StatusBanner from '../components/StatusBanner';
import RoomCodeDisplay from '../components/RoomCodeDisplay';
import VideoPlayer from '../components/VideoPlayer';
import ChatPanel from '../components/ChatPanel';
import VoiceControls from '../components/VoiceControls';
import LatencyBadge from '../components/LatencyBadge';
import FileLoader from '../components/FileLoader';

/* ── Leave Confirmation Modal ─────────────────────────────────────────────── */
function LeaveModal({ isHost, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-sv-text/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white border border-sv-border rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${isHost ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
          {isHost ? (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-black text-sv-text mb-3">
          {isHost ? 'Close the room?' : 'Leave the room?'}
        </h2>
        <p className="text-sv-muted font-medium mb-8 leading-relaxed">
          {isHost
            ? 'Are you sure you want to leave? This will close the room for everyone.'
            : 'Are you sure you want to leave the room?'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl bg-sv-card text-sv-text hover:bg-gray-200 transition-colors font-bold text-[15px]"
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3.5 rounded-xl text-white font-bold text-[15px] transition-colors shadow-sm ${isHost ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {isHost ? 'Close Room' : 'Leave'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const [joinError, setJoinError] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isWebcamFullscreen, setIsWebcamFullscreen] = useState(false);

  const {
    isHost, setIsHost,
    myName, setMyName,
    peerName, setPeerName,
    myHash, setMyHash,
    peerHash, setPeerHash,
    roomStatus, setRoomStatus,
    videoFile, setVideoFile,
    blobUrl, setBlobUrl,
    chatMessages, addChatMessage,
    hashMatch,
    clearRoom
  } = useRoom();

  useEffect(() => {
    const perfEntries = performance.getEntriesByType("navigation");
    if (perfEntries.length > 0 && perfEntries[0].type === "back_forward") {
      sessionStorage.removeItem('sp_session'); clearRoom(); window.location.replace('/'); return;
    }
    if (!myName) {
      const saved = sessionStorage.getItem('sp_session');
      if (saved) {
        try { const { isHost: h, myName: n } = JSON.parse(saved); setIsHost(h); setMyName(n); } catch(e){}
      } else { window.location.replace('/'); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (roomCode && myName) sessionStorage.setItem('sp_session', JSON.stringify({ roomCode, isHost, myName }));
  }, [roomCode, isHost, myName]);

  const { hash, isHashing, error: hashError, computeHash } = useFileHash();

  const roomStatusRef = useRef(roomStatus);
  useEffect(() => { roomStatusRef.current = roomStatus; }, [roomStatus]);

  const applyRemoteEventRef = useRef(null);

  const handleIncomingData = useCallback((data) => {
    if ([SYNC_EVENTS.PLAY, SYNC_EVENTS.PAUSE, SYNC_EVENTS.SEEK, SYNC_EVENTS.RATE].includes(data.type)) {
      if (roomStatusRef.current === ROOM_STATUS.SYNCED && applyRemoteEventRef.current) {
        applyRemoteEventRef.current(data);
      }
    } else if (data.type === 'CHAT') {
      addChatMessage({ id: Date.now(), sender: 'peer', text: data.text, ts: Date.now() });
    }
  }, [addChatMessage]);

  const handleRemoteVoiceStream = useCallback((stream) => {
    if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = stream; remoteVideoRef.current.play().catch(()=>{}); }
  }, []);

  const handlePeerName   = useCallback((name) => setPeerName(name), [setPeerName]);
  const handleJoinError  = useCallback((msg) => setJoinError(msg), []);
  const handlePeerLeft   = useCallback(() => {
    setPeerName(null); setPeerHash(null); setRoomStatus(ROOM_STATUS.WAITING);
  }, [setPeerName, setPeerHash, setRoomStatus]);

  const handlePeerHashReset = useCallback(() => {
    setPeerHash(null);
  }, [setPeerHash]);

  const { isConnected, latencyMs, sendData, addVoiceStream, destroyPeer, triggerHashBroadcastRef } = usePeer({
    roomCode, isHost, myName,
    onData: handleIncomingData, onVoiceStream: handleRemoteVoiceStream,
    onPeerName: handlePeerName, onJoinError: handleJoinError, onPeerLeft: handlePeerLeft,
    onPeerHashReset: handlePeerHashReset,
  });

  const { attachListeners, detachListeners, applyRemoteEvent, forceSync } = useVideoSync({ videoRef, sendData });
  applyRemoteEventRef.current = applyRemoteEvent;
  const { isMuted, isVideoEnabled, isVoiceActive, startVoice, toggleMute, toggleVideo, stopVoice, hasStarted, localStream } = useVoiceChat({ addVoiceStream });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const prevIsConnectedRef = useRef(false);
  useEffect(() => {
    if (!prevIsConnectedRef.current && isConnected) {
      setPeerHash(null);
    }
    prevIsConnectedRef.current = isConnected;
  }, [isConnected, setPeerHash]);

  useEffect(() => {
    const handleLocalDisconnect = () => {
      setMyHash(null);
      setVideoFile(null);
      setBlobUrl(null);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      setRoomStatus(ROOM_STATUS.WAITING);
    };
    socket.on('disconnect', handleLocalDisconnect);
    return () => socket.off('disconnect', handleLocalDisconnect);
  }, [setMyHash, setVideoFile, setBlobUrl, setRoomStatus, blobUrl]);

  useEffect(() => {
    const h = () => { socket.emit('leave-room'); sessionStorage.removeItem('sp_session'); stopVoice(); destroyPeer(); clearRoom(); setTimeout(() => window.location.replace('/'), 150); };
    window.addEventListener('popstate', h);
    return () => window.removeEventListener('popstate', h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on('peer-hash', ({ hash: h }) => setPeerHash(h));
    return () => socket.off('peer-hash');
  }, [setPeerHash]);

  useEffect(() => {
    triggerHashBroadcastRef.current = () => { if (myHash) socket.emit('file-hash', { roomCode, hash: myHash }); };
  }, [myHash, roomCode, triggerHashBroadcastRef]);

  useEffect(() => {
    if (hash && hash !== myHash) { setMyHash(hash); socket.emit('file-hash', { roomCode, hash }); }
  }, [hash, myHash, setMyHash, roomCode]);

  useEffect(() => {
    if (!isConnected) {
      if (peerName) { setRoomStatus(ROOM_STATUS.DISCONNECTED); setPeerHash(null); }
      else           { setRoomStatus(ROOM_STATUS.WAITING); }
      detachListeners();
      if (videoRef.current) videoRef.current.pause();
    } else if (myHash && peerHash) {
      if (videoFile && !isHashing && myHash === peerHash) {
        setRoomStatus(ROOM_STATUS.SYNCED);
        attachListeners();
        if (isHost) {
          setTimeout(() => forceSync(), 800);
        }
      } else if (myHash !== peerHash) {
        setRoomStatus(ROOM_STATUS.DISCONNECTED);
        detachListeners();
        if (videoRef.current) videoRef.current.pause();
      }
    } else {
      setRoomStatus(ROOM_STATUS.VERIFYING);
      if (myHash) socket.emit('file-hash', { roomCode, hash: myHash });
    }
  }, [isConnected, myHash, peerHash, videoFile, isHashing, setRoomStatus, attachListeners, detachListeners, roomCode]);

  const handleFileSelected = useCallback((file) => {
    if (!file) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setVideoFile(null); setBlobUrl(null); setMyHash(null); setPeerHash(null); return;
    }
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    const url = URL.createObjectURL(file);
    setVideoFile(file); setBlobUrl(url); computeHash(file);
  }, [blobUrl, setVideoFile, setBlobUrl, setMyHash, setPeerHash, computeHash]);

  const handleSendChat = (text) => {
    if (!text.trim()) return;
    sendData({ type: 'CHAT', text });
    addChatMessage({ id: Date.now(), sender: 'me', text, ts: Date.now() });
  };

  const handleLeaveConfirmed = () => {
    socket.emit('leave-room');
    sessionStorage.removeItem('sp_session');
    stopVoice(); destroyPeer(); clearRoom();
    setTimeout(() => navigate('/'), 150);
  };

  const displayMyName   = myName || 'You';
  const displayPeerName = peerName;
  const inviteLink      = buildInviteLink(roomCode);

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-white font-sans overflow-hidden">
      
      {/* ── Ultra-Professional Dark Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#09090b]">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        {/* Elegant deep glows */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            SaashPlay
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <LatencyBadge latencyMs={latencyMs} />
          
          <div className="hidden sm:flex">
            <VoiceControls isMuted={isMuted} isVoiceActive={isVoiceActive} onToggleMute={toggleMute} onStartVoice={startVoice} hasStarted={hasStarted} isVideoEnabled={isVideoEnabled} onToggleVideo={toggleVideo} />
          </div>

          <button
            onClick={() => setShowLeaveModal(true)}
            className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Leave
          </button>
        </div>
      </header>

      {showLeaveModal && (
        <LeaveModal
          isHost={isHost}
          onConfirm={handleLeaveConfirmed}
          onCancel={() => setShowLeaveModal(false)}
        />
      )}

      {joinError && (
        <div className="bg-red-500 border-b border-red-600 px-4 py-3 text-white text-sm text-center flex items-center justify-center gap-4 font-bold z-20">
          {joinError}
          <button onClick={() => { sessionStorage.removeItem('sp_session'); navigate('/'); }} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">Go Back</button>
        </div>
      )}

      <StatusBanner status={roomStatus} hashMatch={hashMatch} peerHash={peerHash} myHash={myHash} isHashing={isHashing} videoFile={videoFile} />

      <div className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6 gap-6 items-center">
        
        {/* ── Mobile Voice Controls ── */}
        <div className="sm:hidden w-full max-w-6xl flex justify-end">
          <VoiceControls isMuted={isMuted} isVoiceActive={isVoiceActive} onToggleMute={toggleMute} onStartVoice={startVoice} hasStarted={hasStarted} isVideoEnabled={isVideoEnabled} onToggleVideo={toggleVideo} />
        </div>

        {/* ── Main Stage (Top) ── */}
        <div className="w-full max-w-6xl flex flex-col min-h-[400px] lg:min-h-[550px] bg-[#18181b]/80 backdrop-blur-xl rounded-[2rem] border-2 border-indigo-500/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden relative shrink-0">
          {!videoFile
            ? (
              <div className="flex-1 w-full h-full flex items-center justify-center bg-black/40">
                <FileLoader onFileSelected={handleFileSelected} isHashing={isHashing} hashError={hashError} />
              </div>
            )
            : (
              <div className="flex-1 bg-black relative">
                 <VideoPlayer 
                    videoRef={videoRef} 
                    blobUrl={blobUrl} 
                    status={roomStatus} 
                    hashMatch={hashMatch} 
                    onSelectDifferentFile={() => handleFileSelected(null)} 
                  />
              </div>
            )
          }
        </div>

        {/* ── Info & Chat (Bottom) ── */}
        <div className="w-full max-w-6xl flex flex-col gap-8 pb-10 shrink-0">
          
          {/* Top Row: Room Info Dashboard */}
          <RoomCodeDisplay roomCode={roomCode} inviteLink={inviteLink} myName={myName} peerName={displayPeerName} isHost={isHost} />

          {/* Bottom Row: Webcams & Chat */}
          <div className="flex flex-col lg:flex-row gap-8 h-auto lg:h-[450px]">
            
            {/* Left Side: Webcams */}
            <div className="flex-1 flex flex-col relative">
              {(hasStarted || isConnected) ? (
                <div className={`transition-all duration-500 ease-in-out ${isWebcamFullscreen ? 'fixed inset-0 z-[100] bg-black/95 block p-0 backdrop-blur-md' : 'w-full h-full bg-[#18181b]/80 backdrop-blur-xl rounded-[2rem] p-5 border-2 border-indigo-500/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col relative overflow-hidden group'}`}>
                  <button 
                    onClick={() => setIsWebcamFullscreen(!isWebcamFullscreen)}
                    className={`absolute z-50 p-2.5 rounded-xl transition-all shadow-sm ${isWebcamFullscreen ? 'top-6 right-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md' : 'top-3 right-3 scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md'}`}
                  >
                    {isWebcamFullscreen ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l-5 5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
                  </button>
                  
                  <div className={`relative mx-auto overflow-hidden transition-all duration-500 ${isWebcamFullscreen ? 'absolute inset-0 rounded-none' : 'w-full h-full flex gap-4'}`}>
                    
                    {/* Remote Video */}
                    <div className={`relative overflow-hidden transition-all duration-500 ${isWebcamFullscreen ? 'absolute inset-0 w-full h-full bg-transparent z-0 flex items-center justify-center' : 'flex-1 bg-black/40 rounded-2xl border border-white/10 shadow-inner order-2'}`}>
                      <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full ${isWebcamFullscreen ? 'object-contain' : 'object-cover'}`} />
                      <div className={`absolute font-bold text-white bg-black/60 backdrop-blur-sm transition-all duration-500 z-10 ${isWebcamFullscreen ? 'top-6 left-6 text-sm px-4 py-2 rounded-xl border border-white/10' : 'bottom-1.5 left-1.5 text-[10px] px-2 py-0.5 rounded-md'}`}>
                        {displayPeerName || 'Waiting...'}
                      </div>
                    </div>

                    {/* Local Video */}
                    <div className={`relative overflow-hidden transition-all duration-500 ${isWebcamFullscreen ? 'absolute bottom-8 right-8 w-48 sm:w-72 aspect-video bg-black rounded-2xl border-[3px] border-white/20 shadow-2xl hover:scale-105 cursor-pointer z-10' : 'flex-1 bg-black/40 rounded-2xl border border-white/10 shadow-inner order-1'}`}>
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                      <div className={`absolute font-bold text-white bg-black/60 backdrop-blur-sm transition-all duration-500 z-10 ${isWebcamFullscreen ? 'bottom-2 right-2 text-[10px] px-2 py-1 rounded-lg' : 'bottom-1.5 left-1.5 text-[10px] px-2 py-0.5 rounded-md'}`}>
                        You
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-[#18181b]/80 backdrop-blur-xl rounded-[2rem] p-5 border-2 border-indigo-500/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center text-gray-500 font-bold gap-4 text-sm">
                   <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-sm">
                      <svg className="w-8 h-8 text-gray-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                   </div>
                   Camera Off
                </div>
              )}
            </div>

            {/* Right Side: Chat */}
            <div className="w-full lg:w-[420px] bg-[#18181b]/80 backdrop-blur-xl rounded-[2rem] border-2 border-indigo-500/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col h-[400px] lg:h-full shrink-0">
              <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4">
                <h3 className="text-[13px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Live Chat
                </h3>
              </div>
              <div className="flex-1 relative bg-black/20">
                <ChatPanel messages={chatMessages} onSend={handleSendChat} myName={displayMyName} peerName={displayPeerName} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
