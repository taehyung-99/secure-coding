import { ok } from "@/lib/http";
import {
  createCsrfToken,
  CSRF_COOKIE_NAME,
  csrfCookieOptions,
} from "@/lib/csrf";

export async function GET() {
  const token = await createCsrfToken();
  const response = ok({ token });

  response.cookies.set(CSRF_COOKIE_NAME, token, csrfCookieOptions());

  return response;
}
