import { handleApi, ok, readJson } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { adminInquiryStatusSchema } from "@/lib/validators";
import { updateAdminInquiry } from "@/services/inquiry.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    await requireAdminUser();
    const { id } = await context.params;
    const body = adminInquiryStatusSchema.parse(await readJson(request));
    const inquiry = await updateAdminInquiry(id, body);

    return ok(inquiry);
  });
}
