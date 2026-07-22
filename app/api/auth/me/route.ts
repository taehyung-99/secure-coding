import { errorResponse, ok } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { getUserById } from "@/services/auth.service";

export async function GET() {
  try {
    const sessionUser = await requireCurrentUser();
    const user = await getUserById(sessionUser.id);

    return ok(user);
  } catch (error) {
    return errorResponse(error);
  }
}
