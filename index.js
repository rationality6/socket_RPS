const express = require("express");
const app = express();

const http = require("http");
const path = require("path");
const server = http.createServer(app);
app.use(express.static(path.join(__dirname, "client")));

app.use(express.static("public"));

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

const setDelay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

const declareWinner = async (roomId) => {
  const ownerChoice = roomList[roomId].ownerChoice;
  const guestChoice = roomList[roomId].guestChoice;

  await setDelay(1000);

  if (ownerChoice == guestChoice) {
    io.to(roomId).emit("draw");
  } else if (ownerChoice == "rock" && guestChoice == "scissors") {
    io.to(roomId).emit("ownerWin");
    clientList[0].winningCount += 1;
  } else if (ownerChoice == "scissors" && guestChoice == "paper") {
    io.to(roomId).emit("ownerWin");
    clientList[0].winningCount += 1;
  } else if (ownerChoice == "paper" && guestChoice == "rock") {
    io.to(roomId).emit("ownerWin");
    clientList[0].winningCount += 1;
  } else {
    io.to(roomId).emit("guestWin");
    clientList[0].winningCount += 1;
  }
};

io.on("connection", (socket) => {
  clientList.push({
    userId: socket.id,
    winningCount: 0,
    score: 0,
  });

  socket.emit("setSocketId", { userId: socket.id });
  io.emit("connectionsChanged", { userId: socket.id, clientList: clientList });
  io.emit("updateRoomList", { roomList: roomList });

  socket.on("disconnect", () => {
    const targetIndex = clientList.findIndex(
      (client) => client.userId == socket.id
    );

    Object.keys(roomList).forEach((room) => {
      if (roomList[room].owner == socket.id) {
        delete roomList[room];
      }
    });

    socket.leaveAll();
    clientList.splice(targetIndex, 1);

    io.emit("connectionsChanged", {
      userId: socket.id,
      clientList: clientList,
    });
    io.emit("updateRoomList", { roomList: roomList });
  });

  socket.on("createGame", () => {
    const roomId = String(Math.floor(Math.random() * 100000));

    roomList[roomId] = { owner: socket.id, guest: null };

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

      io.to(data.roomId).emit("playStartSound");

      io.to(data.roomId).emit("playersConnectedToGame");
      io.emit("updateRoomList", { roomList: roomList });
    }

    console.log(roomList);
  });

  socket.on("choiceEvent", async (data) => {
    if (roomList[data.roomId].owner == data.socketId) {
      roomList[data.roomId].ownerChoice = data.choice;
    } else {
      roomList[data.roomId].guestChoice = data.choice;
    }

    socket.broadcast.emit("player2ChoiceEvent", { player2choice: data.choice });

    io.to(data.roomId).emit("playAgainSound");
    await setDelay(1000);

    if (roomList[data.roomId].ownerChoice && roomList[data.roomId].guestChoice) {
      declareWinner(data.roomId);
    
      io.emit("connectionsChanged", {
        userId: socket.id,
        clientList: clientList,
      });
    } else {
    }
    
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
