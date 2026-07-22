"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";

export function TransactionRequestButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const transaction = await apiRequest<{ id: string }>(
        "/api/transactions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        },
        "거래를 요청하지 못했습니다.",
      );

      router.push(`/transactions/${transaction.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "거래를 요청하지 못했습니다.");
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
        className="inline-flex items-center justify-center rounded-md bg-market-coral px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-60"
      >
        {isSubmitting ? "요청 중" : "거래 요청"}
      </button>
      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
    </div>
  );
}
