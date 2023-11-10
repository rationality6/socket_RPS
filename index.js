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

const declareWinner = async (roomId, socket) => {
  const ownerChoice = roomList[roomId].ownerChoice;
  const guestChoice = roomList[roomId].guestChoice;

  await setDelay(1000);

  if (ownerChoice == guestChoice) {
    io.to(roomId).emit("playAgainSound");
    await setDelay(500);
    io.to(roomId).emit("draw");
  } else if (ownerChoice == "rock" && guestChoice == "scissors") {
    io.to(roomId).emit("ownerWin");
    clientList[0].winningCount += 1;
    socket.emit("playWinSound");
  } else if (ownerChoice == "scissors" && guestChoice == "paper") {
    io.to(roomId).emit("ownerWin");
    clientList[0].winningCount += 1;
    socket.emit("playWinSound");
  } else if (ownerChoice == "paper" && guestChoice == "rock") {
    io.to(roomId).emit("ownerWin");
    clientList[0].winningCount += 1;
    socket.emit("playWinSound");
  } else {
    io.to(roomId).emit("guestWin");
    clientList[0].winningCount += 1;
    socket.emit("playWinSound");
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
    if (!roomList[data.roomId]) {
      return;
    }

    const isOwner = roomList[data.roomId].owner == data.socketId;
    if (isOwner) {
      roomList[data.roomId].ownerChoice = data.choice;
    } else {
      roomList[data.roomId].guestChoice = data.choice;
    }

    socket.broadcast.emit("player2ChoiceEvent", { choice: "guess" });

    io.to(data.roomId).emit("playChoiceSound");
    await setDelay(500);

    if (
      roomList[data.roomId].ownerChoice &&
      roomList[data.roomId].guestChoice
    ) {
      if (isOwner) {
        socket.emit("player2ChoiceEvent", {
          choice: roomList[data.roomId].guestChoice,
        });
        socket.broadcast.emit("player2ChoiceEvent", {
          choice: roomList[data.roomId].ownerChoice,
        });
      } else {
        socket.emit("player2ChoiceEvent", {
          choice: roomList[data.roomId].ownerChoice,
        });
        socket.broadcast.emit("player2ChoiceEvent", {
          choice: roomList[data.roomId].guestChoice,
        });
      }

      await setDelay(500);

      declareWinner(data.roomId, socket);

      roomList[data.roomId].ownerChoice = null;
      roomList[data.roomId].guestChoice = null;

      io.emit("connectionsChanged", {
        userId: socket.id,
        clientList: clientList,
      });
    } else {
    }
  });
});

server.listen(8080, () => {
  console.log("listening on *:8080");
});
