import { created, errorResponse, readJson } from "@/lib/http";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session";
import { signupSchema } from "@/lib/validators";
import { signup } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await readJson(request));
    const user = await signup(body);
    const response = created(user);

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
