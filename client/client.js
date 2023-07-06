const socket = io();
let roomId;
let socketId;

const createGame = () => {
  socket.emit("createGame");
};

const joinGame = () => {
  roomId = document.getElementById("roomId").value;
  socket.emit("joinGame", { roomId: roomId });
};

const createCopyButton = () => {
  const copyButton = document.createElement("button");
  copyButton.style.display = "block";
  copyButton.innerHTML = "Copy code";
  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(roomId).then(
      () => {
        console.log("Async: Copying to clipboard was successful!");
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  });
  return copyButton;
};

const createJoinRoomDiv = (rooms, roomKey) => {
  const joinRoomDiv = document.createElement("div");
  joinRoomDiv.classList = "mouse-over-select";
  joinRoomDiv.style.display = "block";

  if (roomId == roomKey) {
    joinRoomDiv.innerHTML = `${roomKey} <span class="border rounded bg-red-300">mine</span>`;
  } else if (rooms[roomKey].guest != null) {
    joinRoomDiv.innerHTML = `${roomKey} <span class="border rounded bg-red-300">full</span>`;
  } else {
    joinRoomDiv.innerHTML = roomKey;
    joinRoomDiv.addEventListener("click", () => {
      socket.emit("joinGame", { roomId: roomKey });
    });
  }

  return joinRoomDiv;
};

socket.on("newGame", (data) => {
  document.getElementById("initial").style.display = "none";
  document.getElementById("waitingArea").style.display = "block";

  document.getElementById(
    "waitingArea"
  ).innerHTML = `waiting ${roomId} to join`;
});

socket.on("playersConnectedToGame", () => {
  document.getElementById("initial").style.display = "none";
  document.getElementById("waitingArea").style.display = "none";
  document.getElementById("gamePlay").style.display = "block";
});

socket.on("setSocketId", (data) => {
  socketId = data.userId;
});

socket.on("setRoomId", (data) => {
  roomId = data.roomId;
});

socket.on("connectionsChanged", (data) => {
  document.getElementById("clientListArea").innerHTML = "";
  data.userIds.forEach((id) => {
    if (id == socketId) {
      document.getElementById(
        "clientListArea"
      ).innerHTML += `<div class="mouse-over-select">
      ${id}
      <span class="border rounded bg-red-300">me</span>
      </div>`;
    } else {
      document.getElementById(
        "clientListArea"
      ).innerHTML += `<div class="mouse-over-select">${id}</div>`;
    }
  });
  document.getElementById("clientTotalArea").innerHTML = data.userIds.length;
});

socket.on("updateRoomList", (data) => {
  document.getElementById("roomListArea").innerHTML = "";

  Object.keys(data.roomList).forEach((roomKey) => {
    document
      .getElementById("roomListArea")
      .append(createJoinRoomDiv(data.roomList, roomKey));
  });

  document.getElementById("roomTotalCountArea").innerHTML = Object.keys(
    data.roomList
  ).length;
});

const sendChoice = (choice) => {
  socket.emit("choiceEvent", { roomId: roomId, choice: choice });
};
