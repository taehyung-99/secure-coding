"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";

type ProductStatusControlProps = {
  productId: string;
  currentStatus: "ON_SALE" | "RESERVED" | "SOLD";
};

const statusLabels = {
  ON_SALE: "판매중",
  RESERVED: "예약중",
  SOLD: "거래완료",
};

export function ProductStatusControl({
  productId,
  currentStatus,
}: ProductStatusControlProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState<string | null>(null);

  async function handleChange(nextStatus: typeof currentStatus) {
    setStatus(nextStatus);
    setMessage(null);

    const response = await csrfFetch(`/api/products/${productId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setStatus(currentStatus);
      setMessage(result?.message ?? "상태를 변경하지 못했습니다.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <select
        value={status}
        onChange={(event) => handleChange(event.target.value as typeof status)}
        className="field"
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
    </div>
  );
}
