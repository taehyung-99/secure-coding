import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import next from "next";
import { configureSocketServer } from "./server/socket";
import { serveUpload } from "./server/uploads";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (await serveUpload(request, response)) {
    return;
  }

  await handle(request, response);
}

async function startServer() {
  await app.prepare();

  const httpServer = createServer((request, response) => {
    void handleRequest(request, response).catch(() => {
      if (!response.headersSent) {
        response.writeHead(500);
        response.end();
        return;
      }

      response.destroy();
    });
  });
  configureSocketServer(httpServer, { dev });

  httpServer.listen(port, hostname, () => {
    console.log(
      `> 이것저것마켓 ready on http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}`,
    );
  });
}

void startServer();
