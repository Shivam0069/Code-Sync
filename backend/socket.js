const socketIO = require("socket.io");

const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  CODE_CHANGE: "code-change",
  SYNC_CODE: "sync-code",
  LEAVE: "leave",
  // Voice chat actions
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
    connection_id: clientId,
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
    console.log("New client connected:", socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
      if (!roomId || !username) {
        return socket.emit("error", {
          message: "Room ID and username are required.",
        });
      }

      userSocketMap[socket.id] = username;
      socket.join(roomId);
      const clients = getAllConnectedClients(roomId);

      // Notify other clients about new user
      clients.forEach(({ connection_id }) => {
        if (connection_id !== socket.id) {
          io.to(connection_id).emit("new_user", {
            username: username,
            connection_id: socket.id,
          });
        }
      });

      // Send existing clients to the new user
      socket.emit("old_users", { clients });

      // Sync code to the new user
      if (roomCodeMap[roomId]) {
        socket.emit(ACTIONS.CODE_CHANGE, { code: roomCodeMap[roomId] });
      }
    });

    // Handle WebRTC signaling
    socket.on("SDPProcess", (data) => {
      console.log(`Forwarding SDP from ${socket.id} to ${data.to_connid}`);
      io.to(data.to_connid).emit("SDPProcess", {
        message: data.message,
        from_connid: socket.id,
      });
    });

    // Handle code changes
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
      roomCodeMap[roomId] = code;
      socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
      io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Handle user leaving
    socket.on(ACTIONS.LEAVE, () => {
      leaveRooms(socket);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      leaveRooms(socket);
    });

    // Helper function to handle user leaving rooms
    function leaveRooms(socket) {
      const rooms = [...socket.rooms];

      rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          // Skip the default room (socket.id)
          socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
            socketId: socket.id,
            username: userSocketMap[socket.id],
          });
          socket.leave(roomId);
        }
      });

      voiceChatUsers.delete(socket.id);
      delete userSocketMap[socket.id];
    }
  });
};

module.exports = { initializeSocket, ACTIONS };
