import { handleApi, ok, readJson } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { updateTransactionStatusSchema } from "@/lib/validators";
import { recordAdminTransactionUpdate } from "@/services/admin.service";
import { updateTransactionStatus } from "@/services/transaction.service";

type TransactionStatusRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: TransactionStatusRouteContext,
) {
  return handleApi(async () => {
    const { id } = await context.params;
    const user = await requireCurrentUser();
    const body = updateTransactionStatusSchema.parse(await readJson(request));
    const transaction = await updateTransactionStatus(user, id, body.status);

    if (user.role === "ADMIN") {
      await recordAdminTransactionUpdate(
        user,
        id,
        body.reason ?? `관리자 거래 상태 변경: ${body.status}`,
      );
    }

    return ok(transaction);
  });
}
