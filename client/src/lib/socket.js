import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
const socket = io(SERVER_URL, { autoConnect: false, reconnectionAttempts: 3 });

// Ping health endpoint to wake up server on free tiers (e.g. Render)
fetch(`${SERVER_URL}/health`).catch(err => console.warn('Wake server failed', err));

export default socket;
