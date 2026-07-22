"use client";

import { csrfFetch } from "@/lib/csrf-client";

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
};

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackMessage: string,
) {
  const response = await csrfFetch(input, init);
  const result = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new Error(result?.message ?? fallbackMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (result?.data === undefined) {
    throw new Error("서버 응답 형식이 올바르지 않습니다.");
  }

  return result.data;
}
