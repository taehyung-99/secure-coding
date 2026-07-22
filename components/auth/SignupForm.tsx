"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";

export function SignupForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function checkAvailability(field: "username" | "email" | "nickname", value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setAvailability((current) => ({ ...current, [field]: "" }));
      return;
    }

    const response = await fetch(
      `/api/auth/availability?${field}=${encodeURIComponent(trimmedValue)}`,
    );
    const result = await response.json().catch(() => null);
    const status = result?.data?.[field];

    setAvailability((current) => ({
      ...current,
      [field]: response.ok
        ? status?.available
          ? "사용 가능합니다."
          : "이미 사용 중입니다."
        : result?.message ?? "확인하지 못했습니다.",
    }));
  }

  function availabilityClass(value: string | undefined) {
    if (!value) {
      return "hidden";
    }

    return value.includes("사용 가능")
      ? "text-xs font-medium text-brand-primary"
      : "text-xs font-medium text-red-600";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      setIsSubmitting(false);
      return;
    }

    const response = await csrfFetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        username: String(formData.get("username") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        password,
        confirmPassword,
        nickname: String(formData.get("nickname") ?? "").trim(),
      }),
    });
    const result = await response.json().catch(() => null);

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result?.message ?? "회원가입에 실패했습니다.");
      return;
    }

    router.push("/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        아이디
        <input
          name="username"
          onBlur={(event) => checkAvailability("username", event.currentTarget.value)}
          className="field"
          placeholder="영문, 숫자, 밑줄 조합"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          autoComplete="username"
        />
        {availability.username ? (
          <span className={availabilityClass(availability.username)}>{availability.username}</span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        이메일
        <input
          name="email"
          type="email"
          onBlur={(event) => checkAvailability("email", event.currentTarget.value)}
          className="field"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        {availability.email ? (
          <span className={availabilityClass(availability.email)}>{availability.email}</span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        닉네임
        <input
          name="nickname"
          onBlur={(event) => checkAvailability("nickname", event.currentTarget.value)}
          className="field"
          placeholder="거래에 표시될 이름"
          required
          minLength={2}
          maxLength={30}
          autoComplete="nickname"
        />
        {availability.nickname ? (
          <span className={availabilityClass(availability.nickname)}>{availability.nickname}</span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        비밀번호
        <input
          name="password"
          type="password"
          className="field"
          placeholder="영문자, 숫자, 특수문자 포함"
          required
          minLength={8}
          pattern="(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
          title="영문자, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요."
          autoComplete="new-password"
        />
        <span className="text-xs text-slate-500">
          영문자, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.
        </span>
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        비밀번호 확인
        <input
          name="confirmPassword"
          type="password"
          className="field"
          placeholder="비밀번호를 한 번 더 입력"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
      >
        {isSubmitting ? "가입 중" : "회원가입"}
      </button>
      <Link
        href="/auth/login"
        className="text-center text-sm font-semibold text-brand-primary hover:text-green-700"
      >
        이미 계정이 있나요? 로그인
      </Link>
    </form>
  );
}
