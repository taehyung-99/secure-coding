"use client";

import { FormEvent, ReactNode, useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";

type ProfileAccessGateProps = {
  children: ReactNode;
};

export function ProfileAccessGate({ children }: ProfileAccessGateProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await csrfFetch("/api/users/me/verify-password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        password: String(formData.get("password") ?? ""),
      }),
    });
    const result = await response.json().catch(() => null);

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result?.message ?? "비밀번호를 확인하지 못했습니다.");
      return;
    }

    setIsVerified(true);
  }

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <h2 className="text-lg font-bold text-market-ink">본인 확인</h2>
        <p className="mt-2 text-sm text-slate-600">
          마이페이지 정보를 확인하려면 현재 비밀번호를 입력해 주세요.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        현재 비밀번호
        <input
          name="password"
          type="password"
          className="rounded-md border border-slate-300 bg-white px-3 py-2"
          required
          minLength={8}
          autoComplete="current-password"
        />
      </label>
      {message ? <p className="text-sm text-market-coral">{message}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-market-leaf px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "확인 중" : "확인"}
      </button>
    </form>
  );
}
