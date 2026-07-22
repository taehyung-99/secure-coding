import { errorResponse, ok } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { userSearchQuerySchema } from "@/lib/validators";
import { searchUsers } from "@/services/user.service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const url = new URL(request.url);
    const query = userSearchQuerySchema.parse({
      q: url.searchParams.get("q") ?? "",
    });
    const users = await searchUsers(user.id, query.q);

    return ok(users);
  } catch (error) {
    return errorResponse(error);
  }
}
