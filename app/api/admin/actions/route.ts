import { handleApi, ok } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { listAdminActions } from "@/services/admin.service";

export async function GET() {
  return handleApi(async () => {
    await requireAdminUser();
    const actions = await listAdminActions();

    return ok(actions);
  });
}
