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
  res.sendFile(__dirname + "/client/index.html");
});

let clientCount = 0;
let rooms = {};

io.on("connection", (socket) => {
  console.log("a user connected");
  clientCount += 1;
  console.log("clientCount: ", clientCount);

  socket.on("disconnect", () => {
    console.log("user disconnected");
    clientCount -= 1;
    console.log("clientCount: ", clientCount);
  });

  socket.on("createGame", () => {
    console.log("createGame, server");

    const roomId = Math.floor(Math.random() * 100);

    rooms[roomId] = {};
    socket.join(roomId);
    socket.emit("newGame", { roomId: roomId });
  });

  socket.on("joinGame", (data) => {
    console.log("joinGame, server");
    console.log("data: ", data.roomId);
    console.log(rooms);
    if (rooms[data.roomId] != null) {
      console.log("exists");
      socket.join(data.roomId);
      socket.to(data.roomId).emit("playersConnected", {});
      socket.emit("playersConnected");

    }
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
