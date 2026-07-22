import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { authenticateSocket } from "./auth";
import { registerChatEvents } from "./chat-events";
import { isSocketOriginAllowed } from "./origin";

type SocketServerOptions = {
  dev: boolean;
};

export function configureSocketServer(
  httpServer: HttpServer,
  { dev }: SocketServerOptions,
) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    allowRequest: (request, callback) => {
      callback(null, isSocketOriginAllowed(request.headers.origin, dev));
    },
  });

  io.use(authenticateSocket);
  registerChatEvents(io);

  return io;
}
