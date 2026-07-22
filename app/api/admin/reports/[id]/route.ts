import { handleApi, ok, readJson } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { adminReportStatusSchema } from "@/lib/validators";
import { updateAdminReportStatus } from "@/services/admin.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    const body = adminReportStatusSchema.parse(await readJson(request));
    const report = await updateAdminReportStatus(
      admin,
      id,
      body.status,
      body.reason,
    );

    return ok(report);
  });
}
