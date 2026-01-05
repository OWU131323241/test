const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  // コマンド（注ぐ、傾ける、振る）をすべてPC画面へ転送
  socket.on("cmd", (data) => {
    io.emit("cmd", data);
  });

  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));