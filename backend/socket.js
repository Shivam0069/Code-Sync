const socketIO = require("socket.io");
const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  CODE_CHANGE: "code-change",
  SYNC_CODE: "sync-code",
  LEAVE: "leave",
};
let io;
const userSocketMap = {};
const roomCodeMap = {};

const getAllConnectedClients = (roomId) => {
  const clients = io.sockets.adapter.rooms.get(roomId);
  if (!clients) return [];

  return [...clients].map((clientId) => ({
    id: clientId,
    username: userSocketMap[clientId],
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

      delete userSocketMap[socket.id];
    });
  });
};

module.exports = { initializeSocket };
