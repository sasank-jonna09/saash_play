export const SYNC_EVENTS = { 
  PLAY: 'PLAY', 
  PAUSE: 'PAUSE', 
  SEEK: 'SEEK', 
  RATE: 'RATE',
  PING: 'PING', 
  PONG: 'PONG' 
};

export const ROOM_STATUS = { 
  WAITING: 'waiting', 
  VERIFYING: 'verifying', 
  SYNCED: 'synced', 
  DISCONNECTED: 'disconnected' 
};

export const SYNC_DELAY_MS = 150; // Buffer delay before applying sync events
export const HASH_MISMATCH_MSG = 'File mismatch! Make sure both users have the exact same video file.';
export const MAX_RECONNECT_ATTEMPTS = 3;
