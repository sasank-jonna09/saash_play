import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ROOM_STATUS } from '../lib/constants';

const RoomContext = createContext();

export function useRoom() {
  return useContext(RoomContext);
}

export function RoomProvider({ children }) {
  const [roomCode, setRoomCode] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [myName, setMyName] = useState('');
  const [peerName, setPeerName] = useState('');
  const [myHash, setMyHash] = useState(null);
  const [peerHash, setPeerHash] = useState(null);
  const [roomStatus, setRoomStatus] = useState(ROOM_STATUS.WAITING);
  const [videoFile, setVideoFile] = useState(null);
  const [blobUrl, setBlobUrlState] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  const hashMatch = useMemo(() => {
    if (!myHash || !peerHash) return null;
    return myHash === peerHash;
  }, [myHash, peerHash]);

  const addChatMessage = useCallback((message) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const setBlobUrl = useCallback((url) => {
    setBlobUrlState(url);
  }, []);

  const clearRoom = useCallback(() => {
    setRoomCode(null);
    setIsHost(false);
    setMyHash(null);
    setPeerHash(null);
    setPeerName('');
    setRoomStatus(ROOM_STATUS.WAITING);
    setVideoFile(null);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    setBlobUrlState(null);
    setChatMessages([]);
  }, [blobUrl]);

  const value = {
    roomCode, setRoomCode,
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
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}
