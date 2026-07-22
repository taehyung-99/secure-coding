"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await csrfFetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        identifier: String(formData.get("identifier") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
      }),
    });
    const result = await response.json().catch(() => null);

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result?.message ?? "로그인에 실패했습니다.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        아이디 또는 이메일
        <input
          name="identifier"
          className="field"
          placeholder="아이디 또는 이메일"
          required
          minLength={3}
          autoComplete="username"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        비밀번호
        <input
          name="password"
          type="password"
          className="field"
          placeholder="비밀번호"
          required
          minLength={8}
          autoComplete="current-password"
        />
      </label>
      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
      >
        {isSubmitting ? "로그인 중" : "로그인"}
      </button>
      <p className="rounded-xl bg-brand-secondary px-3 py-2 text-center text-xs font-medium text-brand-primary">
        로그인 후 채팅, 거래 요청, 신고와 차단 기능을 사용할 수 있습니다.
      </p>
      <Link
        href="/auth/signup"
        className="text-center text-sm font-semibold text-brand-primary hover:text-green-700"
      >
        아직 계정이 없나요? 회원가입
      </Link>
    </form>
  );
}
