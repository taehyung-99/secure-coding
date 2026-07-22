"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api-client";

const inquiryStatusOptions = [
  { value: "OPEN", label: "접수" },
  { value: "IN_PROGRESS", label: "검토중" },
  { value: "ANSWERED", label: "답변완료" },
  { value: "CLOSED", label: "종료" },
];

type AdminInquiryFormProps = {
  inquiryId: string;
  currentStatus: string;
  currentReply: string | null;
};

export function AdminInquiryForm({
  inquiryId,
  currentStatus,
  currentReply,
}: AdminInquiryFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [adminReply, setAdminReply] = useState(currentReply ?? "");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await apiRequest(
        `/api/admin/inquiries/${inquiryId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status,
            adminReply: adminReply.trim() || null,
          }),
        },
        "문의 처리 중 문제가 발생했습니다.",
      );

      setMessage("문의가 처리되었습니다.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "문의 처리 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 grid gap-2">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        aria-label="문의 상태"
      >
        {inquiryStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <textarea
        value={adminReply}
        onChange={(event) => setAdminReply(event.target.value)}
        placeholder="관리자 답변"
        rows={4}
        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-fit rounded-md bg-market-leaf px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "저장 중" : "답변 저장"}
      </button>
      {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </form>
  );
}
