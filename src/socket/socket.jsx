import { io } from "socket.io-client";

const socket = io("https://whot-1.onrender.com", {
  transports: ["websocket"], // helps avoid polling issues on Render
});

export default socket;
