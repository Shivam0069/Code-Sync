const socketIO = require("socket.io");

const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  CODE_CHANGE: "code-change",
  SYNC_CODE: "sync-code",
  LEAVE: "leave",
  // Add new voice chat actions
  VOICE_OFFER: "voice-offer",
  VOICE_ANSWER: "voice-answer",
  ICE_CANDIDATE: "ice-candidate",
  START_VOICE_CHAT: "start-voice-chat",
  END_VOICE_CHAT: "end-voice-chat",
};

let io;
const userSocketMap = {};
const roomCodeMap = {};
const voiceChatUsers = new Set(); // Track users in voice chat

const getAllConnectedClients = (roomId) => {
  const clients = io.sockets.adapter.rooms.get(roomId);
  if (!clients) return [];

  return [...clients].map((clientId) => ({
    id: clientId,
    username: userSocketMap[clientId],
    isInVoiceChat: voiceChatUsers.has(clientId),
  }));
};

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Existing connection handling code...
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
      if (!roomId || !username) {
        return socket.emit("error", {
          message: "Room ID and username are required.",
        });
      }

      userSocketMap[socket.id] = username;
      socket.join(roomId);
      const clients = getAllConnectedClients(roomId);

      clients.forEach(({ id }) => {
        io.to(id).emit(ACTIONS.JOINED, {
          clients,
          username,
          socketId: socket.id,
        });
      });
    });

    // Voice chat signaling handlers
    socket.on(ACTIONS.START_VOICE_CHAT, ({ roomId }) => {
      voiceChatUsers.add(socket.id);
      const clients = getAllConnectedClients(roomId);
      console.log("clients", clients);
      io.to(roomId).emit("voice-chat-users-updated", { clients });
    });

    socket.on(ACTIONS.END_VOICE_CHAT, ({ roomId }) => {
      voiceChatUsers.delete(socket.id);
      const clients = getAllConnectedClients(roomId);
      console.log("clients", clients);
      io.to(roomId).emit("voice-chat-users-updated", { clients });
    });

    // WebRTC signaling
    socket.on(ACTIONS.VOICE_OFFER, ({ offer, to }) => {
      io.to(to).emit(ACTIONS.VOICE_OFFER, {
        offer,
        from: socket.id,
      });
    });

    socket.on(ACTIONS.VOICE_ANSWER, ({ answer, to }) => {
      io.to(to).emit(ACTIONS.VOICE_ANSWER, {
        answer,
        from: socket.id,
      });
    });

    socket.on(ACTIONS.ICE_CANDIDATE, ({ candidate, to }) => {
      io.to(to).emit(ACTIONS.ICE_CANDIDATE, {
        candidate,
        from: socket.id,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const rooms = [...socket.rooms];

      rooms.forEach((roomId) => {
        if (userSocketMap[socket.id]) {
          socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
            socketId: socket.id,
            username: userSocketMap[socket.id],
          });
        }
      });

      voiceChatUsers.delete(socket.id);
      delete userSocketMap[socket.id];
    });

    // Existing code handling events...
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
      roomCodeMap[roomId] = code;
      socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
      io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.LEAVE, () => {
      const rooms = [...socket.rooms];

      rooms.forEach((roomId) => {
        if (userSocketMap[socket.id]) {
          socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
            socketId: socket.id,
            username: userSocketMap[socket.id],
          });
        }
      });

      voiceChatUsers.delete(socket.id);
      delete userSocketMap[socket.id];
    });
  });
};

module.exports = { initializeSocket, ACTIONS };
