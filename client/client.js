const socket = io();
let roomId = null;

const createGame = () => {
  socket.emit("createGame");
};

const joinGame = () => {
  console.log("join");
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

socket.on("newGame", (data) => {
  roomId = data.roomId;
  document.getElementById("initial").style.display = "none";
  document.getElementById("gamePlay").style.display = "block";

  document.getElementById(
    "waitingArea"
  ).innerHTML = `waiting ${roomId} to join`;

  let copyButton = createCopyButton();
  document.getElementById("waitingArea").appendChild(copyButton);
});

socket.on("playersConnectedToGame", () => {
  console.log("playersConnectedToGame", "client");
  document.getElementById("waitingArea").innerHTML = `playersConnectedToGame`;
});

socket.on("newPlayerConnected", () => {
  console.log("newPlayerConnected");
});
