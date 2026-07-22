import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getChatSocket() {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
}
