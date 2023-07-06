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
let roomList = {};

io.on("connection", (socket) => {
  clientList.push(socket.id);

  socket.emit("setSocketId", { userId: socket.id });
  io.emit("connectionsChanged", { userIds: clientList });
  io.emit("updateRoomList", { roomList: roomList });

  socket.on("disconnect", () => {
    const targetIndex = clientList.indexOf(socket.id);
    
    Object.keys(roomList).forEach((room) => {
      if(roomList[room].owner == socket.id){
        delete roomList[room]
      }
    })

    socket.leaveAll();
    clientList.splice(targetIndex, 1);

    io.emit("connectionsChanged", { userIds: clientList });
    io.emit("updateRoomList", { roomList: roomList });
  });

  socket.on("createGame", () => {
    const roomId = String(Math.floor(Math.random() * 100000));

    roomList[roomId] = { owner: socket.id, guest: null };
    console.log(roomList)
    socket.join(roomId);
    socket.emit("setRoomId", { roomId: roomId });
    socket.emit("newGame", { roomId: roomId });
    io.emit("updateRoomList", { roomList: roomList });
  });

  socket.on("joinGame", (data) => {
    console.log(`joinGame ${data.roomId}`);

    if (roomList[data.roomId] != null) {
      socket.join(data.roomId);
      roomList[data.roomId].guest = socket.id;
      io.to(data.roomId).emit("playersConnectedToGame");
      io.emit("updateRoomList", { roomList: roomList });
    }

    console.log(roomList)
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
