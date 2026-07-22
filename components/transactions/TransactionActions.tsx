"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";

type TransactionActionsProps = {
  transactionId: string;
  status: string;
  isBuyer: boolean;
  isSeller: boolean;
};

export function TransactionActions({
  transactionId,
  status,
  isBuyer,
  isSeller,
}: TransactionActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runAction(
    input: RequestInfo,
    init: RequestInit,
    fallbackMessage: string,
  ) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await apiRequest(input, init, fallbackMessage);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateStatus(nextStatus: string) {
    return runAction(
      `/api/transactions/${transactionId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      },
      "거래 상태를 변경하지 못했습니다.",
    );
  }

  function payMock() {
    return runAction(
      "/api/payments/mock",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      },
      "결제를 처리하지 못했습니다.",
    );
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-brand-text">거래 액션</p>
      {status === "REQUESTED" && isSeller ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => updateStatus("ACCEPTED")}
            disabled={isSubmitting}
            className="btn-primary"
          >
            요청 수락
          </button>
          <button
            type="button"
            onClick={() => updateStatus("REJECTED")}
            disabled={isSubmitting}
            className="btn-danger"
          >
            요청 거절
          </button>
        </div>
      ) : null}

      {status === "ACCEPTED" && isBuyer ? (
        <button
          type="button"
          onClick={payMock}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-bold text-brand-text shadow-sm hover:bg-amber-300 disabled:opacity-60"
        >
          모의 결제
        </button>
      ) : null}

      {status === "PAID" && isSeller ? (
        <button
          type="button"
          onClick={() => updateStatus("COMPLETED")}
          disabled={isSubmitting}
          className="btn-primary"
        >
          거래 완료
        </button>
      ) : null}

      {["REQUESTED", "ACCEPTED", "PAYMENT_PENDING"].includes(status) ? (
        <button
          type="button"
          onClick={() => updateStatus("CANCELED")}
          disabled={isSubmitting}
          className="btn-secondary"
        >
          거래 취소
        </button>
      ) : null}

      {message ? <p className="text-sm text-market-coral">{message}</p> : null}
    </div>
  );
}
