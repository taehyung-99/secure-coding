export const CSRF_COOKIE_NAME = "local_market_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

const CSRF_TTL_SECONDS = 60 * 60 * 24 * 7;

function getCsrfSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be at least 32 characters.");
    }

    return "development-session-secret-change-before-production";
  }

  return secret;
}

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sign(value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getCsrfSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return toBase64Url(signature);
}

function timingSafeEqual(actual: string, expected: string) {
  if (actual.length !== expected.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < actual.length; index += 1) {
    result |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }

  return result === 0;
}

export async function createCsrfToken() {
  const nonce = crypto.randomUUID();
  const signature = await sign(nonce);

  return `${nonce}.${signature}`;
}

export async function verifyCsrfToken(token: string | null | undefined) {
  if (!token) {
    return false;
  }

  const [nonce, signature] = token.split(".");

  if (!nonce || !signature) {
    return false;
  }

  const expectedSignature = await sign(nonce);

  return timingSafeEqual(signature, expectedSignature);
}

export function csrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CSRF_TTL_SECONDS,
  };
}
