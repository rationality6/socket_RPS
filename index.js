const express = require("express");
const app = express();

const http = require("http");
const path = require("path");
const server = http.createServer(app);
app.use(express.static(path.join(__dirname, "client")));

const { Server } = require("socket.io");
const io = new Server(server);

app.get("/hearthcheck", (req, res) => {
  res.send("<h1>rps app running....</h1>");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

let totalClientCount = 0;
let rooms = {};

io.on("connection", (socket) => {
  console.log("user connected");
  totalClientCount += 1;
  console.log("totalClientCount: ", totalClientCount);

  io.emit("newPlayerConnected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
    totalClientCount -= 1;
    console.log("totalClientCount: ", totalClientCount);
  });

  socket.on("createGame", () => {
    console.log("createGame");

    const roomId = String(Math.floor(Math.random() * 100));

    rooms[roomId] = {};
    socket.join(roomId);
    socket.emit("newGame", { roomId: roomId });
  });

  socket.on("joinGame", (data) => {
    console.log(`joinGame ${data.roomId}`);

    if (rooms[data.roomId] != null) {
      socket.join(data.roomId);
      io.to(data.roomId).emit("playersConnectedToGame");
    }
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
