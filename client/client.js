const socket = io();

let roomId;
let socketId;

const createGame = () => {
  socket.emit("createGame");
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
      roomId = roomKey;
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
  const clientListDiv = document.getElementById("clientListArea");
  clientListDiv.innerHTML = "";

  data.clientList.forEach((client) => {
    if (client.userId == socketId) {
      clientListDiv.innerHTML += `<div class="mouse-over-select">
        ${client.userId}
        <span class="bg-green-200">${client.winningCount}</span>
        <span>${client.score}</span>
        <span class="border rounded bg-red-300">me</span>
        </div>
      `;
    } else {
      clientListDiv.innerHTML += `
        <div class="mouse-over-select">
        ${client.userId}
        <span class="bg-green-200">${client.winningCount}</span>
        <span>${client.score}</span>
        </div>`;
    }
  });

  document.getElementById("clientTotalArea").innerHTML = data.clientList.length;
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

const createRockPaperScissorsButton = (choice) => {
  const rpsobj = {
    rock: {
      image: "images/r.png",
      text: "Rock",
      key: "q",
    },
    paper: {
      image: "images/p.png",
      text: "Paper",
      key: "w",
    },
    scissors: {
      image: "images/s.png",
      text: "Scissors",
      key: "e",
    },
    guess: {
      image: "images/question_mark.png",
      text: "",
      key: "",
    },
  };

  const rpsButtonString = `
    <button class='rpc-card'>
      <img src='${rpsobj[choice].image}' class='w-12 h-12'>
      ${rpsobj[choice].text}
      <div class='text-gray-300'>
        ${rpsobj[choice].key}
      </div>
    </button>
  `;

  return rpsButtonString;
};

const resetRPCButtons = () => {
  document.getElementById("playerChoice").innerHTML = `      <button class="rpc-card" onclick="sendChoice('rock')">
            <img src="images/rock_auto_con.png" class="w-12 h-12" alt="">
            Rock <div class="text-gray-300">q</div>
          </button>
          <button class="rpc-card" onclick="sendChoice('paper')">
            <img src="images/auto_paper.png" class="w-12 h-12" alt="">
            Paper <div class="text-gray-300">w</div>
          </button>
          <button class="rpc-card" onclick="sendChoice('scissors')">
            <img src="images/scissors.png" class="w-12 h-12" alt="">
            Scissors <div class="text-gray-300">e</div>
          </button>`;
};

const sendChoice = (choice) => {
  document.getElementById("playerChoice").innerHTML =
    createRockPaperScissorsButton(choice);

  socket.emit("choiceEvent", {
    roomId: roomId,
    choice: choice,
    socketId: socketId,
  });
};

socket.on("playerChoiceEvent", (data) => {});

socket.on("player2ChoiceEvent", (data) => {
  document.getElementById("player2Choice").innerHTML =
    createRockPaperScissorsButton("guess");
});

socket.on("ownerWin", (data) => {
  console.log("ownerWin");
});

socket.on("guestWin", (data) => {
  console.log("guestWin");
});

socket.on("draw", (data) => {
  console.log("draw");
  new Audio("sounds/jankenman_start.mp3").play();
  resetRPCButtons();
});

socket.on("playStartSound", () => {
  new Audio("sounds/jankenman_start.mp3").play();
});

socket.on("playAgainSound", () => {
  new Audio("sounds/play_again.mp3").play();
});
