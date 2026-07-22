"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api-client";

export function ProductReportForm({ productId }: { productId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    try {
      await apiRequest(
        `/api/products/${productId}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: String(formData.get("reason") ?? "").trim(),
            detail: String(formData.get("detail") ?? "").trim() || undefined,
          }),
        },
        "상품 신고를 접수하지 못했습니다.",
      );

      event.currentTarget.reset();
      setMessage("상품 신고가 접수되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상품 신고를 접수하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="surface grid gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-brand-text">상품 안전 신고</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            부적절하거나 의심스러운 상품은 운영자에게 접수됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="btn-danger"
        >
          상품 신고
        </button>
      </div>
      {isOpen ? (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl bg-brand-background p-4">
          <h2 className="text-base font-bold text-brand-text">상품 신고</h2>
          <select
            name="reason"
            className="field"
            required
            defaultValue=""
          >
            <option value="" disabled>
              신고 사유 선택
            </option>
            <option value="판매 금지 상품">판매 금지 상품</option>
            <option value="허위 또는 과장 정보">허위 또는 과장 정보</option>
            <option value="사기 의심">사기 의심</option>
            <option value="부적절한 이미지 또는 설명">부적절한 이미지 또는 설명</option>
            <option value="기타">기타</option>
          </select>
          <textarea
            name="detail"
            placeholder="상세 내용을 작성해 주세요."
            className="field min-h-24"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-danger justify-center bg-white"
          >
            {isSubmitting ? "접수 중" : "신고 접수"}
          </button>
        </form>
      ) : null}
      {message ? <p className="rounded-xl bg-brand-secondary px-3 py-2 text-sm font-medium text-brand-primary">{message}</p> : null}
    </div>
  );
}
