import { created, handleApi, readJson } from "@/lib/http";
import { assertRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { requireCurrentUser } from "@/lib/session";
import { reportReasonSchema } from "@/lib/validators";
import { createReport } from "@/services/report.service";

type UserReportRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: UserReportRouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const user = await requireCurrentUser();
    const body = reportReasonSchema.parse(await readJson(request));
    await assertRateLimit({
      key: `report:${user.id}`,
      ...rateLimitPolicies.report,
    });
    const report = await createReport(user.id, {
      targetType: "USER",
      targetUserId: id,
      ...body,
    });

    return created(report);
  });
}
