import { errorResponse, ok, readJson } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { updateProductStatusSchema } from "@/lib/validators";
import { updateProductStatus } from "@/services/product.service";

type ProductStatusRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: ProductStatusRouteContext,
) {
  try {
    const { id } = await context.params;
    const user = await requireCurrentUser();
    const body = updateProductStatusSchema.parse(await readJson(request));
    const product = await updateProductStatus(id, user, body.status);

    return ok(product);
  } catch (error) {
    return errorResponse(error);
  }
}
