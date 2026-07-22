import type { Server } from "socket.io";
import type { SessionUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { getChatRoom } from "../services/chat.service";

type JoinAcknowledgement = (result: { ok: boolean; message?: string }) => void;

type PublishPayload = {
  chatRoomId?: string;
  messageId?: string;
};

export function registerChatEvents(io: Server) {
  io.on("connection", (socket) => {
    const user = socket.data.user as SessionUser;

    socket.on(
      "chat:join",
      async (chatRoomId: string, acknowledge?: JoinAcknowledgement) => {
        try {
          await getChatRoom(user, chatRoomId);
          await socket.join(`chat:${chatRoomId}`);
          acknowledge?.({ ok: true });
        } catch {
          acknowledge?.({
            ok: false,
            message: "채팅방에 참여할 수 없습니다.",
          });
        }
      },
    );

    socket.on("chat:publish", async (payload: PublishPayload) => {
      if (!payload.chatRoomId || !payload.messageId) {
        return;
      }

      try {
        await getChatRoom(user, payload.chatRoomId);
        const message = await prisma.message.findFirst({
          where: {
            id: payload.messageId,
            chatRoomId: payload.chatRoomId,
            senderId: user.id,
          },
          select: {
            id: true,
            chatRoomId: true,
            content: true,
            readAt: true,
            createdAt: true,
            senderId: true,
            sender: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    nickname: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        });

        if (message) {
          io.to(`chat:${payload.chatRoomId}`).emit("chat:message", message);
        }
      } catch {
        // Invalid room or message identifiers are intentionally ignored.
      }
    });

    socket.on("chat:leave", (chatRoomId: string) => {
      void socket.leave(`chat:${chatRoomId}`);
    });
  });
}
