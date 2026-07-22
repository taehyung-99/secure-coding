import { handleApi, ok } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { listAdminTransactions } from "@/services/admin.service";

export async function GET() {
  return handleApi(async () => {
    await requireAdminUser();
    const transactions = await listAdminTransactions();

    return ok(transactions);
  });
}
