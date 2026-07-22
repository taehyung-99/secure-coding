import type { Server } from "socket.io";
import { prisma } from "../lib/prisma";
import { assertRateLimit, rateLimitPolicies } from "../lib/rate-limit";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../lib/session-token";

type SocketMiddleware = Parameters<Server["use"]>[0];

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  for (const item of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = item.trim().split("=");

    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

export const authenticateSocket: SocketMiddleware = async (
  socket,
  nextMiddleware,
) => {
  try {
    const token = readCookie(
      socket.request.headers.cookie,
      SESSION_COOKIE_NAME,
    );
    const payload = token ? verifySessionToken(token) : null;

    if (!payload) {
      nextMiddleware(new Error("로그인이 필요합니다."));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      nextMiddleware(new Error("활성 상태의 계정만 사용할 수 있습니다."));
      return;
    }

    await assertRateLimit({
      key: `websocket-connection:${user.id}`,
      ...rateLimitPolicies.websocketConnection,
    });

    socket.data.user = user;
    nextMiddleware();
  } catch {
    nextMiddleware(new Error("실시간 채팅 인증에 실패했습니다."));
  }
};
