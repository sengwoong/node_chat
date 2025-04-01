

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {}; // { roomId: Set of sockets }

wss.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("message", (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "join":
        {
          const { roomId } = data;
          if (!rooms[roomId]) {
            rooms[roomId] = new Set();
          }
          rooms[roomId].add(socket);
          socket.roomId = roomId; // Save room ID for the user
          console.log(`User joined room ${roomId}`);
        }
        break;

      case "signal":
        {
          const { roomId, signalData } = data;
          // Broadcast signal data to all other users in the room
          rooms[roomId].forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(signalData));
            }
          });
        }
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  });

  socket.on("close", () => {
    if (socket.roomId) {
      rooms[socket.roomId].delete(socket);
      console.log(`User disconnected from room ${socket.roomId}`);
      if (rooms[socket.roomId].size === 0) {
        delete rooms[socket.roomId];
        console.log(`Room ${socket.roomId} deleted`);
      }
    }
  });
});
