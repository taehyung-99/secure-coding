import { noContent } from "@/lib/http";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session";

export async function POST() {
  const response = noContent();

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
