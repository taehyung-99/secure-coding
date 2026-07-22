"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api-client";

type Option = {
  value: string;
  label: string;
};

type AdminStatusFormProps = {
  endpoint: string;
  fieldName: string;
  currentValue: string;
  options: Option[];
  buttonLabel: string;
};

export function AdminStatusForm({
  endpoint,
  fieldName,
  currentValue,
  options,
  buttonLabel,
}: AdminStatusFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(currentValue);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await apiRequest(
        endpoint,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            [fieldName]: value,
            reason: reason || undefined,
          }),
        },
        "처리 중 문제가 발생했습니다.",
      );

      setReason("");
      setMessage("처리되었습니다.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처리 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-[1fr_1fr_auto]">
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="field"
        aria-label="상태 선택"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="조치 사유"
        className="field"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
      >
        {isSubmitting ? "처리 중" : buttonLabel}
      </button>
      {message ? (
        <p className="text-xs text-slate-500 sm:col-span-3">{message}</p>
      ) : null}
    </form>
  );
}
