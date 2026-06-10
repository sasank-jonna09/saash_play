import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoiceChat({ addVoiceStream }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const localStream = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const rawStreamRef = useRef(null);

  const startVoice = useCallback(async (withVideo = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // Auto gain helps in varying environments
          sampleRate: 48000,
          channelCount: 2, // Stereo or high-quality mono
        },
        video: withVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });

      rawStreamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const destination = audioContext.createMediaStreamDestination();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      source.connect(analyser);
      source.connect(destination);

      const processedStream = destination.stream;
      
      // If video exists, add it to the processed stream
      stream.getVideoTracks().forEach(track => {
        processedStream.addTrack(track);
      });

      localStream.current = processedStream;
      addVoiceStream(processedStream);
      
      setIsVideoEnabled(withVideo);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        setIsVoiceActive(average > 15);
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

    } catch (err) {
      console.error('Error accessing media devices', err);
    }
  }, [addVoiceStream]);

  const toggleMute = useCallback(() => {
    if (rawStreamRef.current) {
      const audioTrack = rawStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(async () => {
    if (!rawStreamRef.current) {
      // If stream hasn't started, start with video
      await startVoice(true);
      return;
    }
    
    let videoTrack = rawStreamRef.current.getVideoTracks()[0];
    
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    } else {
      // If we didn't request video initially, we have to request it now
      try {
        const vidStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
        const newVidTrack = vidStream.getVideoTracks()[0];
        rawStreamRef.current.addTrack(newVidTrack);
        localStream.current.addTrack(newVidTrack);
        
        // We need to trigger renegotiation in SimplePeer
        // The easiest way is to re-add the stream
        addVoiceStream(localStream.current);
        
        setIsVideoEnabled(true);
      } catch(e) {
        console.error('Could not get webcam', e);
      }
    }
  }, [startVoice, addVoiceStream]);

  const stopVoice = useCallback(() => {
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach(track => track.stop());
      rawStreamRef.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsVoiceActive(false);
    setIsVideoEnabled(false);
    setIsMuted(false);
  }, []);

  useEffect(() => {
    return () => { stopVoice(); };
  }, [stopVoice]);

  return { isMuted, isVideoEnabled, isVoiceActive, startVoice, toggleMute, toggleVideo, stopVoice, hasStarted: !!rawStreamRef.current, localStream: rawStreamRef.current };
}
