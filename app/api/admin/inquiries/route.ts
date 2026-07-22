import { handleApi, ok } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { listAdminInquiries } from "@/services/inquiry.service";

export async function GET() {
  return handleApi(async () => {
    await requireAdminUser();
    const inquiries = await listAdminInquiries();

    return ok(inquiries);
  });
}
