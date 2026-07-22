import { created, handleApi, ok, readJson } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { createInquirySchema } from "@/lib/validators";
import { createInquiry, listMyInquiries } from "@/services/inquiry.service";

export async function GET() {
  return handleApi(async () => {
    const user = await requireCurrentUser();
    const inquiries = await listMyInquiries(user.id);

    return ok(inquiries);
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireCurrentUser();
    const body = createInquirySchema.parse(await readJson(request));
    const inquiry = await createInquiry(user.id, body);

    return created(inquiry);
  });
}
