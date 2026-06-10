export const DEFAULT_PEER_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add free TURN server here for strict NAT environments
  ]
};

export function getPeerOptions(isInitiator) {
  return {
    initiator: isInitiator,
    trickle: true,
    config: DEFAULT_PEER_CONFIG
    // Voice stream will be added later via peer.addStream()
  };
}
