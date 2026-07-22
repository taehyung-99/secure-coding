import { created, handleApi, noContent } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { blockUser, unblockUser } from "@/services/block.service";

type UserBlockRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: UserBlockRouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const user = await requireCurrentUser();
    const block = await blockUser(user.id, id);

    return created(block);
  });
}

export async function DELETE(_request: Request, context: UserBlockRouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const user = await requireCurrentUser();

    await unblockUser(user.id, id);

    return noContent();
  });
}
