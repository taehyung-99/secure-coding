import { errorResponse, ok } from "@/lib/http";
import { authAvailabilityQuerySchema } from "@/lib/validators";
import { checkAuthAvailability } from "@/services/auth.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = authAvailabilityQuerySchema.parse({
      username: url.searchParams.get("username") ?? undefined,
      email: url.searchParams.get("email") ?? undefined,
      nickname: url.searchParams.get("nickname") ?? undefined,
    });
    const result = await checkAuthAvailability(query);

    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
