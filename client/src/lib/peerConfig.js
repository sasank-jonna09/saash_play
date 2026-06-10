const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

if (import.meta.env.VITE_TURN_SERVER_URL) {
  iceServers.push({
    urls: import.meta.env.VITE_TURN_SERVER_URL,
    username: import.meta.env.VITE_TURN_SERVER_USERNAME,
    credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
  });
}

export const DEFAULT_PEER_CONFIG = {
  iceServers
};

export function getPeerOptions(isInitiator) {
  return {
    initiator: isInitiator,
    trickle: true,
    config: DEFAULT_PEER_CONFIG
    // Voice stream will be added later via peer.addStream()
  };
}
