import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

const UPLOAD_ROUTE_PATTERN =
  /^\/uploads\/(products|profiles)\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(jpg|png|webp)$/;

const UPLOAD_DIRECTORIES = {
  products: path.join(process.cwd(), "public", "uploads", "products"),
  profiles: path.join(process.cwd(), "public", "uploads", "profiles"),
} as const;

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

function endResponse(response: ServerResponse, statusCode: number) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": "0",
    "X-Content-Type-Options": "nosniff",
  });
  response.end();
}

function getRequestPath(request: IncomingMessage) {
  try {
    return decodeURIComponent(
      new URL(request.url ?? "/", "http://localhost").pathname,
    );
  } catch {
    return null;
  }
}

function hasOwnKey<T extends object>(
  target: T,
  key: PropertyKey,
): key is keyof T {
  return Object.prototype.hasOwnProperty.call(target, key);
}

export async function serveUpload(
  request: IncomingMessage,
  response: ServerResponse,
) {
  const requestPath = getRequestPath(request);

  if (!requestPath?.startsWith("/uploads/")) {
    return false;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    endResponse(response, 405);
    return true;
  }

  const match = UPLOAD_ROUTE_PATTERN.exec(requestPath);

  if (!match) {
    endResponse(response, 404);
    return true;
  }

  const [, target, id, extension] = match;

  if (
    !target ||
    !id ||
    !extension ||
    !hasOwnKey(UPLOAD_DIRECTORIES, target) ||
    !hasOwnKey(CONTENT_TYPES, extension)
  ) {
    endResponse(response, 404);
    return true;
  }

  const filename = `${id}.${extension}`;
  const filepath = path.join(UPLOAD_DIRECTORIES[target], filename);

  try {
    const file = await stat(filepath);

    if (!file.isFile()) {
      endResponse(response, 404);
      return true;
    }

    response.writeHead(200, {
      "Cache-Control": "public, max-age=3600",
      "Content-Length": file.size,
      "Content-Type": CONTENT_TYPES[extension],
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
    });

    if (request.method === "HEAD") {
      response.end();
      return true;
    }

    const stream = createReadStream(filepath);
    stream.on("error", () => response.destroy());
    stream.pipe(response);
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      endResponse(response, 404);
      return true;
    }

    endResponse(response, 500);
    return true;
  }
}
