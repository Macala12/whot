import { io } from "socket.io-client";

const socket = io("https://whot-production.up.railway.app", {
  transports: ["websocket"], // helps avoid polling issues on Render
});

export default socket;
