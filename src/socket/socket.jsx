import { io } from "socket.io-client";

// const socket = io("https://whot-1.onrender.com", {
//   transports: ["websocket"], // helps avoid polling issues on Render
// });

const socket = io("http://localhost:8000", {
  transports: ["websocket"], // helps avoid polling issues on Render
});

export default socket;
