"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";

export function StartProductChatButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const chatRoom = await apiRequest<{ id: string }>(
        "/api/chatrooms",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        },
        "채팅방을 만들지 못했습니다.",
      );

      router.push(`/chatrooms/${chatRoom.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "채팅방을 만들지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className="btn-primary"
      >
        {isSubmitting ? "채팅방 준비 중" : "판매자에게 메시지"}
      </button>
      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
    </div>
  );
}
