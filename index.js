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

let clientList = [];
let rooms = {};

io.on("connection", (socket) => {
  clientList.push(socket.id);

  io.emit("connectionsChanged", { userIds: clientList });

  socket.on("disconnect", () => {
    const targetIndex = clientList.indexOf(socket.id);
    clientList.splice(targetIndex, 1);

    io.emit("connectionsChanged", { userIds: clientList });
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
