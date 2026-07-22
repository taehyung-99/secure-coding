import { handleApi, ok } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { getTransaction } from "@/services/transaction.service";

type TransactionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: TransactionRouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const user = await requireCurrentUser();
    const transaction = await getTransaction(user, id);

    return ok(transaction);
  });
}
