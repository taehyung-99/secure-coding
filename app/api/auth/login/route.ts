import { ok, errorResponse, readJson } from "@/lib/http";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session";
import { loginSchema } from "@/lib/validators";
import { login } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await readJson(request));
    const user = await login(body);
    const response = ok(user);

    response.cookies.set(
      SESSION_COOKIE_NAME,
      createSessionToken(user.id),
      sessionCookieOptions(),
    );

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
