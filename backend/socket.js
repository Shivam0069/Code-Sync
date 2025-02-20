const socketIO = require("socket.io");

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
    console.log(`New client connected: ${socket.id}`);

    socket.on("join", ({ roomId, username }) => {
      if (!roomId || !username) {
        return socket.emit("error", {
          message: "Room ID and username are required.",
        });
      }

      userSocketMap[socket.id] = username;
      socket.join(roomId);
      const clients = getAllConnectedClients(roomId);

      const currentCode = roomCodeMap[roomId] || "";
      socket.emit("code-sync", { code: currentCode });

      clients.forEach(({ id }) => {
        io.to(id).emit("joined", {
          clients,
          username,
          socketId: socket.id,
        });
      });
    });

    socket.on("code-changed", ({ roomId, code }) => {
      roomCodeMap[roomId] = code;
      socket.in(roomId).emit("code-changed", { code });
    });

    socket.on("code-sync", ({ socketId, code }) => {
      io.to(socketId).emit("code-changed", { code });
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];

      rooms.forEach((roomId) => {
        if (userSocketMap[socket.id]) {
          socket.in(roomId).emit("disconnected", {
            socketId: socket.id,
            username: userSocketMap[socket.id],
          });
        }
      });

      delete userSocketMap[socket.id];
    });
  });
};

module.exports = {
  initializeSocket,
};
