"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { csrfFetch } from "@/lib/csrf-client";

type SearchUser = {
  id: string;
  username: string;
  profile: {
    nickname: string | null;
    region: string | null;
  } | null;
};

export function DirectChatStarter() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
    const result = await response.json().catch(() => null);

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result?.message ?? "사용자를 검색하지 못했습니다.");
      return;
    }

    setUsers(result.data);
  }

  async function startChat(targetUserId: string) {
    setMessage(null);

    const response = await csrfFetch("/api/chatrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(result?.message ?? "채팅방을 만들지 못했습니다.");
      return;
    }

    router.push(`/chatrooms/${result.data.id}`);
  }

  return (
    <section className="surface p-4">
      <h2 className="text-base font-bold text-market-ink">1:1 채팅 시작</h2>
      <form onSubmit={search} className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="아이디 또는 닉네임 검색"
          className="field min-w-0 flex-1"
          required
          maxLength={50}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="btn-dark"
        >
          {isLoading ? "검색 중" : "검색"}
        </button>
      </form>

      {users.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => startChat(user.id)}
              className="rounded-md border border-market-line bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-semibold text-market-ink">
                {user.profile?.nickname ?? user.username}
              </span>
              <span className="ml-2 text-slate-500">@{user.username}</span>
            </button>
          ))}
        </div>
      ) : null}

      {message ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{message}</p> : null}
    </section>
  );
}
