import { errorResponse, ok, readJson } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { verifyPasswordSchema } from "@/lib/validators";
import { verifyMyPassword } from "@/services/user.service";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = verifyPasswordSchema.parse(await readJson(request));
    await verifyMyPassword(user.id, body.password);

    return ok({ verified: true });
  } catch (error) {
    return errorResponse(error);
  }
}
