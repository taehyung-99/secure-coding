import { handleApi, ok } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { getPayment } from "@/services/payment.service";

type PaymentRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: PaymentRouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const user = await requireCurrentUser();
    const payment = await getPayment(user, id);

    return ok(payment);
  });
}
