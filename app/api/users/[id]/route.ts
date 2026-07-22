import { errorResponse, ok } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";
import { getPublicUserProfile } from "@/services/user.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const viewer = await getCurrentUser();
    const { id } = await context.params;
    const profile = await getPublicUserProfile(id, viewer);

    return ok(profile);
  } catch (error) {
    return errorResponse(error);
  }
}
