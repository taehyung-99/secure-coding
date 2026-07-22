import { created, handleApi, readJson } from "@/lib/http";
import { assertRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { requireCurrentUser } from "@/lib/session";
import { reportSchema } from "@/lib/validators";
import { createReport } from "@/services/report.service";

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireCurrentUser();
    const body = reportSchema.parse(await readJson(request));
    await assertRateLimit({
      key: `report:${user.id}`,
      ...rateLimitPolicies.report,
    });
    const report = await createReport(user.id, body);

    return created(report);
  });
}
