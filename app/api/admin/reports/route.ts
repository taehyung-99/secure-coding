import { handleApi, ok } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { listAdminReports } from "@/services/admin.service";

export async function GET() {
  return handleApi(async () => {
    await requireAdminUser();
    const reports = await listAdminReports();

    return ok(reports);
  });
}
