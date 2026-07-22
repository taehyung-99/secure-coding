"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await csrfFetch("/api/auth/logout", {
      method: "POST",
    });
    setIsSubmitting(false);
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="inline-flex h-16 w-[4.5rem] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-1.5 py-2 text-[11px] font-semibold text-slate-700 hover:bg-brand-secondary disabled:opacity-60 sm:h-auto sm:w-auto sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm"
      title="로그아웃"
    >
      <LogOut size={16} aria-hidden />
      <span className="whitespace-nowrap leading-none">
        {isSubmitting ? "처리 중" : "로그아웃"}
      </span>
    </button>
  );
}
