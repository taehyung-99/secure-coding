import { errorResponse, noContent, ok, readJson } from "@/lib/http";
import { getCurrentUser, requireCurrentUser } from "@/lib/session";
import { updateProductSchema } from "@/lib/validators";
import {
  deleteProduct,
  getProductDetail,
  updateProduct,
} from "@/services/product.service";

type ProductRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: ProductRouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const product = await getProductDetail(id, user);

    return ok(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: ProductRouteContext) {
  try {
    const { id } = await context.params;
    const user = await requireCurrentUser();
    const body = updateProductSchema.parse(await readJson(request));
    const product = await updateProduct(id, user, body);

    return ok(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: ProductRouteContext) {
  try {
    const { id } = await context.params;
    const user = await requireCurrentUser();

    await deleteProduct(id, user);

    return noContent();
  } catch (error) {
    return errorResponse(error);
  }
}
