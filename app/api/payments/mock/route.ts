import { created, handleApi, readJson } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { mockPaymentSchema } from "@/lib/validators";
import { recordAdminTransactionUpdate } from "@/services/admin.service";
import { createMockPayment } from "@/services/payment.service";

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireCurrentUser();
    const body = mockPaymentSchema.parse(await readJson(request));
    const payment = await createMockPayment(user, body.transactionId);

    if (user.role === "ADMIN") {
      await recordAdminTransactionUpdate(
        user,
        body.transactionId,
        "관리자 모의 결제 처리",
      );
    }

    return created(payment);
  });
}
