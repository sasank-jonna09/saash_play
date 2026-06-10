import { useRef, useCallback } from 'react';
import { SYNC_EVENTS, SYNC_DELAY_MS } from '../lib/constants';

export function useVideoSync({ videoRef, sendData }) {
  // targetState tracks the desired state imposed by remote events.
  // When local events fire, we check if they match the target state.
  // If they do, we consume the state and DO NOT forward the event.
  const targetState = useRef({
    playing: null,
    seekTime: null,
    rate: null
  });

  // forceSync: push host state to the guest after (re)sync.
  const forceSync = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    sendData({ type: SYNC_EVENTS.SEEK,  time: v.currentTime });
    sendData({ type: v.paused ? SYNC_EVENTS.PAUSE : SYNC_EVENTS.PLAY });
    sendData({ type: SYNC_EVENTS.RATE,  rate: v.playbackRate });
  }, [sendData, videoRef]);

  // ── outbound handlers (user → peer) ──────────────────────────────────────
  const handlePlay = useCallback(() => {
    if (targetState.current.playing === true) {
      targetState.current.playing = null;
      return;
    }
    targetState.current.playing = null;
    if (document.hidden) return;
    sendData({ type: SYNC_EVENTS.PLAY });
  }, [sendData]);

  const handlePause = useCallback(() => {
    if (targetState.current.playing === false) {
      targetState.current.playing = null;
      return;
    }
    targetState.current.playing = null;
    if (document.hidden) return;
    sendData({ type: SYNC_EVENTS.PAUSE });
  }, [sendData]);

  const handleSeeked = useCallback(() => {
    const time = videoRef.current.currentTime;
    if (targetState.current.seekTime !== null) {
      if (Math.abs(time - targetState.current.seekTime) < 0.5) {
        targetState.current.seekTime = null;
        return;
      }
      targetState.current.seekTime = null;
    }
    if (document.hidden) return;
    sendData({ type: SYNC_EVENTS.SEEK, time });
  }, [sendData, videoRef]);

  const handleRateChange = useCallback(() => {
    const rate = videoRef.current.playbackRate;
    if (targetState.current.rate !== null && targetState.current.rate === rate) {
      targetState.current.rate = null;
      return;
    }
    targetState.current.rate = null;
    if (document.hidden) return;
    sendData({ type: SYNC_EVENTS.RATE, rate });
  }, [sendData, videoRef]);

  // ── attach / detach ───────────────────────────────────────────────────────
  const attachListeners = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.removeEventListener('play',       handlePlay);
    v.removeEventListener('pause',      handlePause);
    v.removeEventListener('seeked',     handleSeeked);
    v.removeEventListener('ratechange', handleRateChange);
    v.addEventListener('play',       handlePlay);
    v.addEventListener('pause',      handlePause);
    v.addEventListener('seeked',     handleSeeked);
    v.addEventListener('ratechange', handleRateChange);
  }, [handlePlay, handlePause, handleSeeked, handleRateChange, videoRef]);

  const detachListeners = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.removeEventListener('play',       handlePlay);
    v.removeEventListener('pause',      handlePause);
    v.removeEventListener('seeked',     handleSeeked);
    v.removeEventListener('ratechange', handleRateChange);
    targetState.current = { playing: null, seekTime: null, rate: null };
  }, [handlePlay, handlePause, handleSeeked, handleRateChange, videoRef]);

  // ── inbound handler (peer → local video) ─────────────────────────────────
  const applyRemoteEvent = useCallback((event) => {
    const v = videoRef.current;
    if (!v) return;
    const { type, time, rate } = event;

    setTimeout(() => {
      const vid = videoRef.current;
      if (!vid) return;

      if (type === SYNC_EVENTS.SEEK) {
        targetState.current.seekTime = time;
        vid.currentTime = time;
      } else if (type === SYNC_EVENTS.PLAY) {
        targetState.current.playing = true;
        vid.play().catch(e => {
          console.error('Play prevented by browser:', e);
          targetState.current.playing = null;
        });
      } else if (type === SYNC_EVENTS.PAUSE) {
        targetState.current.playing = false;
        vid.pause();
      } else if (type === SYNC_EVENTS.RATE) {
        targetState.current.rate = rate;
        vid.playbackRate = rate;
      }
    }, SYNC_DELAY_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef]);

  return { attachListeners, detachListeners, applyRemoteEvent, forceSync };
}
