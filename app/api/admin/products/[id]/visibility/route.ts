import { handleApi, ok, readJson } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { adminProductVisibilitySchema } from "@/lib/validators";
import { updateAdminProductVisibility } from "@/services/admin.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    const body = adminProductVisibilitySchema.parse(await readJson(request));
    const product = await updateAdminProductVisibility(
      admin,
      id,
      body.visibility,
      body.reason,
    );

    return ok(product);
  });
}
