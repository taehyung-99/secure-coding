import { handleApi, ok } from "@/lib/http";
import { requireAdminUser } from "@/lib/session";
import { listAdminProducts } from "@/services/admin.service";

export async function GET() {
  return handleApi(async () => {
    await requireAdminUser();
    const products = await listAdminProducts();

    return ok(products);
  });
}
