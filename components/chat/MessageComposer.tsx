"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";
import type { RealtimeMessage } from "@/components/chat/RealtimeChat";

type MessageComposerProps = {
  chatRoomId: string;
  onMessageCreated?: (message: RealtimeMessage) => void;
};

export function MessageComposer({
  chatRoomId,
  onMessageCreated,
}: MessageComposerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const content = String(formData.get("content") ?? "").trim();

    const response = await csrfFetch(`/api/chatrooms/${chatRoomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const result = await response.json().catch(() => null);

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result?.message ?? "메시지를 보내지 못했습니다.");
      return;
    }

    form.reset();
    if (onMessageCreated && result?.data?.id && result.data.sender) {
      onMessageCreated(result.data as RealtimeMessage);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 border-t border-gray-200 bg-brand-background p-4">
      <textarea
        name="content"
        placeholder="메시지를 입력하세요"
        className="field min-h-24 resize-none"
        required
        maxLength={1000}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
      >
        {isSubmitting ? "전송 중" : "메시지 전송"}
      </button>
      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
    </form>
  );
}
