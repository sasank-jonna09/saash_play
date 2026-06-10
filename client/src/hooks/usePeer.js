import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import socket from '../lib/socket';
import { getPeerOptions } from '../lib/peerConfig';
import { SYNC_EVENTS } from '../lib/constants';

export function usePeer({ roomCode, isHost, myName, onData, onVoiceStream, onPeerName, onJoinError, onPeerLeft, onPeerHashReset }) {
  const [isConnected, setIsConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const peerRef = useRef(null);
  const pingIntervalRef = useRef(null);
  
  const onDataRef = useRef(onData);
  const onVoiceStreamRef = useRef(onVoiceStream);
  const onPeerNameRef = useRef(onPeerName);
  const onJoinErrorRef = useRef(onJoinError);
  const onPeerLeftRef = useRef(onPeerLeft);
  const onPeerHashResetRef = useRef(onPeerHashReset);
  
  // Expose a ref to trigger hash re-broadcasts
  const triggerHashBroadcastRef = useRef(null);
  
  useEffect(() => { onDataRef.current = onData; }, [onData]);
  useEffect(() => { onVoiceStreamRef.current = onVoiceStream; }, [onVoiceStream]);
  useEffect(() => { onPeerNameRef.current = onPeerName; }, [onPeerName]);
  useEffect(() => { onJoinErrorRef.current = onJoinError; }, [onJoinError]);
  useEffect(() => { onPeerLeftRef.current = onPeerLeft; }, [onPeerLeft]);
  useEffect(() => { onPeerHashResetRef.current = onPeerHashReset; }, [onPeerHashReset]);

  const destroyPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    setIsConnected(false);
    setLatencyMs(null);
  }, []);

  const sendData = useCallback((data) => {
    if (peerRef.current && peerRef.current.connected) {
      try { peerRef.current.send(JSON.stringify(data)); } catch (e) { /* peer may be closing */ }
    }
  }, []);

  const addVoiceStream = useCallback((stream) => {
    if (peerRef.current && peerRef.current.connected) {
      peerRef.current.addStream(stream);
    }
  }, []);

  useEffect(() => {
    if (!roomCode || !myName) return;

    socket.connect();

    const createPeer = (isInitiator) => {
      const p = new SimplePeer(getPeerOptions(isInitiator));

      p.on('signal', data => socket.emit('signal', { roomCode, signal: data }));

      p.on('connect', () => {
        setIsConnected(true);
        pingIntervalRef.current = setInterval(() => {
          if (p.connected) {
            try { p.send(JSON.stringify({ type: SYNC_EVENTS.PING, ts: Date.now() })); } catch (e) {}
          }
        }, 2000);
      });

      p.on('close', () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      });

      p.on('error', err => console.error('Peer error:', err.message));

      p.on('data', rawData => {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed.type === SYNC_EVENTS.PING) {
            sendData({ type: SYNC_EVENTS.PONG, ts: parsed.ts });
          } else if (parsed.type === SYNC_EVENTS.PONG) {
            setLatencyMs(Date.now() - parsed.ts);
          } else {
            onDataRef.current && onDataRef.current(parsed);
          }
        } catch (e) {}
      });

      p.on('stream', stream => onVoiceStreamRef.current && onVoiceStreamRef.current(stream));

      return p;
    };

    const initRoom = () => {
      if (isHost) {
        socket.emit('create-room', { roomCode, name: myName || 'Host' });
      } else {
        socket.emit('join-room', { roomCode, name: myName || 'Guest' });
      }
    };

    if (socket.connected) {
      initRoom();
    } else {
      socket.on('connect', initRoom);
    }

    // HOST: listen for guest joining
    socket.on('peer-joined', ({ peerName } = {}) => {
      if (isHost) {
        if (onPeerNameRef.current) onPeerNameRef.current(peerName || 'Guest');
        if (peerRef.current) { peerRef.current.destroy(); }
        peerRef.current = createPeer(true);
      }
    });

    // GUEST: listen for successful join
    socket.on('room-joined', ({ peerName } = {}) => {
      if (!isHost) {
        if (onPeerNameRef.current) onPeerNameRef.current(peerName || 'Host');
        if (peerRef.current) peerRef.current.destroy();
        peerRef.current = createPeer(false);
      }
    });

    socket.on('room-not-found', () => {
      if (onJoinErrorRef.current) onJoinErrorRef.current('Room not found. Check the code and try again.');
    });

    socket.on('room-full', () => {
      if (onJoinErrorRef.current) onJoinErrorRef.current('Room is already full.');
    });

    socket.on('signal', ({ signal }) => {
      if (peerRef.current) {
        try { peerRef.current.signal(signal); } catch (e) {}
      }
    });

    socket.on('peer-disconnected', () => {
      destroyPeer();
    });

    socket.on('room-closed', () => {
      sessionStorage.removeItem('sp_session');
      window.location.replace('/?error=host_closed');
    });

    socket.on('request-hash', () => {
      if (triggerHashBroadcastRef.current) {
        triggerHashBroadcastRef.current();
      }
    });

    socket.on('peer-hash-reset', () => {
      if (onPeerHashResetRef.current) onPeerHashResetRef.current();
    });

    socket.on('peer-left', () => {
      if (onPeerLeftRef.current) onPeerLeftRef.current();
    });

    return () => {
      socket.off('peer-joined');
      socket.off('room-joined');
      socket.off('room-not-found');
      socket.off('room-full');
      socket.off('signal');
      socket.off('peer-disconnected');
      socket.off('peer-left');
      socket.off('room-closed');
      socket.off('request-hash');
      socket.off('peer-hash-reset');
      socket.off('connect', initRoom);
      destroyPeer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, isHost, myName]);

  return { isConnected, latencyMs, sendData, addVoiceStream, destroyPeer, triggerHashBroadcastRef };
}
