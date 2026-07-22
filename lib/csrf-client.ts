"use client";

import { CSRF_HEADER_NAME } from "@/lib/csrf";

let cachedToken: string | null = null;

async function getCsrfToken() {
  if (cachedToken) {
    return cachedToken;
  }

  const response = await fetch("/api/csrf", {
    method: "GET",
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  const token = result?.data?.token;

  if (!response.ok || typeof token !== "string") {
    throw new Error("CSRF 토큰을 발급받지 못했습니다.");
  }

  cachedToken = token;

  return token;
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = String(init.method ?? "GET").toUpperCase();

  if (!["POST", "PATCH", "DELETE"].includes(method)) {
    return fetch(input, init);
  }

  const headers = new Headers(init.headers);
  headers.set(CSRF_HEADER_NAME, await getCsrfToken());

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.headers.get("x-csrf-error") !== "1") {
    return response;
  }

  cachedToken = null;
  headers.set(CSRF_HEADER_NAME, await getCsrfToken());

  return fetch(input, {
    ...init,
    headers,
  });
}
