// test-socket.cjs
const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("✅ Connected to WebSocket server:", socket.id);
});

socket.on("paymentStatusUpdate", (data) => {
  console.log("💸 Payment status update:", data);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});
