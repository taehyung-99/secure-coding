"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";

export function UnblockButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUnblock() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await apiRequest(
        `/api/users/${userId}/block`,
        { method: "DELETE" },
        "차단을 해제하지 못했습니다.",
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "차단을 해제하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={handleUnblock}
        disabled={isSubmitting}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
      >
        {isSubmitting ? "해제 중" : "차단 해제"}
      </button>
      {message ? <p className="text-xs text-red-600">{message}</p> : null}
    </div>
  );
}
