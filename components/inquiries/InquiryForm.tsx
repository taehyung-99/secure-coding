"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api-client";

export function InquiryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await apiRequest(
        "/api/inquiries",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title, content }),
        },
        "문의를 접수하지 못했습니다.",
      );

      setTitle("");
      setContent("");
      setMessage("문의가 접수되었습니다.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "문의를 접수하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface grid gap-3 p-4">
      <label className="grid gap-1 text-sm font-semibold text-market-ink">
        제목
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={2}
          maxLength={120}
          required
          className="field font-normal"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-market-ink">
        문의 내용
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          minLength={5}
          maxLength={2000}
          required
          rows={5}
          className="field font-normal"
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-fit"
      >
        {isSubmitting ? "접수 중" : "문의 접수"}
      </button>
      {message ? <p className="text-sm text-slate-500">{message}</p> : null}
    </form>
  );
}
