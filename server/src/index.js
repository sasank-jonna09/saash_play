require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { log } = require('./logger');
const RoomManager = require('./roomManager');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({
  origin: CLIENT_ORIGIN
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: roomManager.listRooms(),
    uptime: process.uptime()
  });
});

io.on('connection', (socket) => {
  log('INFO', `Socket connected: ${socket.id}`);

  socket.on('create-room', ({ roomCode, name }) => {
    if (!/^[A-Za-z0-9]{6}$/.test(roomCode)) {
      socket.emit('error', 'Invalid room code format.');
      return;
    }
    
    const createResult = roomManager.createRoom(roomCode, socket.id, name);
    socket.join(roomCode);
    socket.emit('room-created');
    log('INFO', `Room created/rejoined: ${roomCode} by ${name || socket.id}`);

    // If host is rejoining and a guest is still connected, reset their peerHash
    // so they wait for the host to re-verify before syncing again.
    if (createResult.isRejoin && createResult.guestSocketId) {
      io.to(createResult.guestSocketId).emit('peer-hash-reset');
    }

    // If a guest is already waiting in the room, tell the host they are here
    const room = roomManager.getRoom(roomCode);
    if (room && room.guestSocketId && room.guestName) {
      socket.emit('peer-joined', { peerName: room.guestName });
      io.to(room.guestSocketId).emit('room-joined', { peerName: room.hostName });
    }

    // Room cleanup after 4 hours TTL
    setTimeout(() => {
      const room = roomManager.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room-expired');
        io.socketsLeave(roomCode); // Removes all sockets from the room
        roomManager.deleteRoom(roomCode);
        log('INFO', `Room expired and cleaned up: ${roomCode}`);
      }
    }, 4 * 60 * 60 * 1000);
  });

  socket.on('join-room', ({ roomCode, name }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      socket.emit('room-not-found');
      return;
    }
    if (roomManager.isRoomFull(roomCode)) {
      socket.emit('room-full');
      return;
    }

    try {
      roomManager.joinRoom(roomCode, socket.id, name);
    } catch (e) {
      socket.emit('error', e.message);
      return;
    }
    
    socket.join(roomCode);
    
    // Tell the host: a guest joined, send guest's name
    io.to(room.hostSocketId).emit('peer-joined', { peerName: name || 'Guest' });
    
    // Fix 4: Guest (re)joined — host must clear their stale peerHash and
    // wait for the guest to re-upload and re-hash their file.
    io.to(room.hostSocketId).emit('peer-hash-reset');
    
    // CRITICAL: Re-request file hash from host when a new guest joins so the guest can sync
    io.to(room.hostSocketId).emit('request-hash');
    
    // Tell the guest: they joined, send host's name
    socket.emit('room-joined', { peerName: room.hostName || 'Host' });
    
    log('INFO', `${name || socket.id} joined room: ${roomCode}`);
  });

  socket.on('signal', ({ roomCode, signal }) => {
    const room = roomManager.getRoom(roomCode);
    if (room) {
      const otherSocketId = room.hostSocketId === socket.id ? room.guestSocketId : room.hostSocketId;
      if (otherSocketId) {
        io.to(otherSocketId).emit('signal', { signal });
      }
    }
  });

  socket.on('file-hash', ({ roomCode, hash }) => {
    const room = roomManager.getRoom(roomCode);
    if (room) {
      const otherSocketId = room.hostSocketId === socket.id ? room.guestSocketId : room.hostSocketId;
      if (otherSocketId) {
        io.to(otherSocketId).emit('peer-hash', { hash });
      }
    }
  });

  socket.on('leave-room', () => {
    const result = roomManager.removeSocket(socket.id);
    if (result) {
      const { roomCode, role } = result;
      log('INFO', `Socket ${socket.id} (${role}) explicitly left room ${roomCode}`);
      
      const room = roomManager.getRoom(roomCode);
      if (room) {
        if (role === 'host') {
          io.to(roomCode).emit('room-closed');
          roomManager.deleteRoom(roomCode);
        } else {
          if (room.hostSocketId) {
            io.to(room.hostSocketId).emit('peer-left');
          }
        }
      }
      socket.leave(roomCode);
    }
  });

  socket.on('disconnect', () => {
    const result = roomManager.removeSocket(socket.id);
    if (result) {
      const { roomCode, role } = result;
      log('INFO', `Socket ${socket.id} (${role}) disconnected from room ${roomCode}`);
      
      const room = roomManager.getRoom(roomCode);
      if (room) {
        const remainingSocketId = role === 'host' ? room.guestSocketId : room.hostSocketId;
        if (remainingSocketId) {
          // Fix 4: Tell the staying peer to wipe their stale peerHash immediately
          io.to(remainingSocketId).emit('peer-hash-reset');
          io.to(remainingSocketId).emit('peer-disconnected', { role });
        }
      }
    }
  });
});

server.listen(PORT, () => {
  log('INFO', `Signaling server running on port ${PORT}`);
  log('INFO', `CORS allowed origin: ${CLIENT_ORIGIN}`);
});
