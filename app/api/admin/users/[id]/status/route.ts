import { handleApi, ok, readJson } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { adminUserStatusSchema } from "@/lib/validators";
import { updateAdminUserStatus } from "@/services/admin.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    const body = adminUserStatusSchema.parse(await readJson(request));
    const user = await updateAdminUserStatus(
      admin,
      id,
      body.status,
      body.reason,
    );

    return ok(user);
  });
}
