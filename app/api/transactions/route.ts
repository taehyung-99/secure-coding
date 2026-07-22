import { created, handleApi, ok, readJson } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { createTransactionSchema } from "@/lib/validators";
import {
  createTransaction,
  listTransactions,
} from "@/services/transaction.service";

export async function GET() {
  return handleApi(async () => {
    const user = await requireCurrentUser();
    const transactions = await listTransactions(user);

    return ok(transactions);
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireCurrentUser();
    const body = createTransactionSchema.parse(await readJson(request));
    const result = await createTransaction(user, body.productId);

    return result.created ? created(result.transaction) : ok(result.transaction);
  });
}
