"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";

export function ProductDeleteButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("상품을 삭제할까요?")) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    const response = await csrfFetch(`/api/products/${productId}`, {
      method: "DELETE",
    });

    setIsDeleting(false);

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setMessage(result?.message ?? "상품을 삭제하지 못했습니다.");
      return;
    }

    router.push("/products");
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="btn-danger"
      >
        {isDeleting ? "삭제 중" : "상품 삭제"}
      </button>
      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
    </div>
  );
}
