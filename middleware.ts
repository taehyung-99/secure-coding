import { NextResponse, type NextRequest } from "next/server";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  verifyCsrfToken,
} from "@/lib/csrf";

const PROTECTED_METHODS = new Set(["POST", "PATCH", "DELETE"]);

export async function middleware(request: NextRequest) {
  if (!PROTECTED_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const csrfHeader = request.headers.get(CSRF_HEADER_NAME);

  if (
    !csrfCookie ||
    !csrfHeader ||
    csrfCookie !== csrfHeader ||
    !(await verifyCsrfToken(csrfHeader))
  ) {
    return NextResponse.json(
      { message: "보안 토큰이 유효하지 않습니다. 새로고침 후 다시 시도해 주세요." },
      {
        status: 403,
        headers: {
          "x-csrf-error": "1",
        },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
