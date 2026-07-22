"use client";

import { useEffect, useState } from "react";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { ScrollableMessages } from "@/components/chat/ScrollableMessages";
import { getChatSocket } from "@/lib/socket-client";

export type RealtimeMessage = {
  id: string;
  chatRoomId: string;
  content: string;
  readAt: string | Date | null;
  createdAt: string | Date;
  senderId: string;
  sender: {
    id: string;
    username: string;
    profile: {
      nickname: string | null;
      avatarUrl: string | null;
    } | null;
  };
};

function isRealtimeMessage(value: unknown): value is RealtimeMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Partial<RealtimeMessage>;

  return (
    typeof message.id === "string" &&
    typeof message.chatRoomId === "string" &&
    typeof message.content === "string" &&
    typeof message.senderId === "string" &&
    Boolean(message.sender) &&
    typeof message.sender?.username === "string"
  );
}

type RealtimeChatProps = {
  chatRoomId: string;
  currentUserId: string;
  initialMessages: RealtimeMessage[];
  showSenderName?: boolean;
};

export function RealtimeChat({
  chatRoomId,
  currentUserId,
  initialMessages,
  showSenderName = false,
}: RealtimeChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "offline"
  >("connecting");
  useEffect(() => {
    const socket = getChatSocket();

    function joinRoom() {
      setConnectionState("connected");
      socket.emit(
        "chat:join",
        chatRoomId,
        (result: { ok: boolean }) => {
          if (!result.ok) {
            setConnectionState("offline");
          }
        },
      );
    }

    function handleDisconnect() {
      setConnectionState("offline");
    }

    function handleMessage(message: unknown) {
      if (!isRealtimeMessage(message) || message.chatRoomId !== chatRoomId) {
        return;
      }

      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
    }

    socket.on("connect", joinRoom);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("chat:message", handleMessage);

    if (socket.connected) {
      joinRoom();
    } else {
      setConnectionState("connecting");
      socket.connect();
    }

    return () => {
      socket.emit("chat:leave", chatRoomId);
      socket.off("connect", joinRoom);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("chat:message", handleMessage);
    };
  }, [chatRoomId]);

  function handleMessageCreated(message: RealtimeMessage) {
    setMessages((current) =>
      current.some((item) => item.id === message.id)
        ? current
        : [...current, message],
    );

    getChatSocket().emit("chat:publish", {
      chatRoomId,
      messageId: message.id,
    });
  }

  const stateLabel = {
    connecting: "실시간 연결 중",
    connected: "실시간 연결됨",
    offline: "연결 끊김 · 메시지는 저장됩니다",
  }[connectionState];

  return (
    <>
      <div className="flex justify-end border-b border-gray-100 bg-white px-4 py-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            connectionState === "connected"
              ? "text-emerald-700"
              : "text-gray-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connectionState === "connected" ? "bg-emerald-500" : "bg-gray-400"
            }`}
            aria-hidden
          />
          {stateLabel}
        </span>
      </div>

      <ScrollableMessages
        scrollKey={`${chatRoomId}:${messages.at(-1)?.id ?? "empty"}`}
      >
        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          const senderName =
            message.sender.profile?.nickname ?? message.sender.username;

          return (
            <div
              key={message.id}
              className={`grid max-w-[85%] gap-1 rounded-2xl px-4 py-3 text-sm shadow-sm ${
                isMine
                  ? "ml-auto rounded-br-md bg-brand-primary text-white"
                  : "mr-auto rounded-bl-md bg-brand-secondary text-brand-text"
              }`}
            >
              {showSenderName ? (
                <span
                  className={`text-xs font-semibold ${
                    isMine ? "text-white/75" : "text-brand-primary"
                  }`}
                >
                  {senderName}
                </span>
              ) : null}
              <p className="whitespace-pre-wrap">{message.content}</p>
              <span
                className={`text-xs ${
                  isMine ? "text-white/75" : "text-gray-500"
                }`}
              >
                {new Date(message.createdAt).toLocaleString("ko-KR")}
              </span>
            </div>
          );
        })}

        {messages.length === 0 ? (
          <div className="surface-muted p-8 text-center text-sm text-slate-600">
            아직 메시지가 없습니다.
          </div>
        ) : null}
      </ScrollableMessages>

      <MessageComposer
        chatRoomId={chatRoomId}
        onMessageCreated={handleMessageCreated}
      />
    </>
  );
}
