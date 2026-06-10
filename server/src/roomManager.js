class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomCode, hostSocketId, hostName) {
    const existing = this.rooms.get(roomCode);
    if (existing) {
      existing.hostSocketId = hostSocketId;
      existing.hostName = hostName || 'Host';
      return { isRejoin: true, guestSocketId: existing.guestSocketId };
    }
    this.rooms.set(roomCode, {
      hostSocketId,
      hostName: hostName || 'Host',
      guestSocketId: null,
      guestName: '',
      createdAt: Date.now()
    });
    return { isRejoin: false, guestSocketId: null };
  }

  joinRoom(roomCode, guestSocketId, guestName) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.guestSocketId) {
      throw new Error('Room is full');
    }
    room.guestSocketId = guestSocketId;
    room.guestName = guestName || 'Guest';
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode) || null;
  }

  removeSocket(socketId) {
    for (const [roomCode, room] of this.rooms.entries()) {
      if (room.hostSocketId === socketId) {
        room.hostSocketId = null;
        // If both are null, we might want to clean up, but the prompt says 4hr TTL handles it
        return { roomCode, role: 'host' };
      }
      if (room.guestSocketId === socketId) {
        room.guestSocketId = null;
        return { roomCode, role: 'guest' };
      }
    }
    return null;
  }

  getRoomCode(socketId) {
    for (const [roomCode, room] of this.rooms.entries()) {
      if (room.hostSocketId === socketId || room.guestSocketId === socketId) {
        return roomCode;
      }
    }
    return null;
  }

  isRoomFull(roomCode) {
    const room = this.rooms.get(roomCode);
    return !!(room && room.hostSocketId && room.guestSocketId);
  }

  deleteRoom(roomCode) {
    this.rooms.delete(roomCode);
  }

  listRooms() {
    return this.rooms.size;
  }
}

module.exports = RoomManager;
