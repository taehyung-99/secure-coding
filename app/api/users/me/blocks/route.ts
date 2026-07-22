import { handleApi, ok } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { listMyBlocks } from "@/services/block.service";

export async function GET() {
  return handleApi(async () => {
    const user = await requireCurrentUser();
    const blocks = await listMyBlocks(user.id);

    return ok(blocks);
  });
}
