import { handleApi, ok } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { listAdminUsers } from "@/services/admin.service";

export async function GET() {
  return handleApi(async () => {
    await requireAdminUser();
    const users = await listAdminUsers();

    return ok(users);
  });
}
