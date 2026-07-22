import { created, errorResponse, ok, readJson } from "@/lib/http";
import { getCurrentUser, requireCurrentUser } from "@/lib/session";
import {
  createProductSchema,
  productListQuerySchema,
} from "@/lib/validators";
import { createProduct, listProducts } from "@/services/product.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = productListQuerySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );
    const user = await getCurrentUser();
    const products = await listProducts(query, user);

    return ok(products);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = createProductSchema.parse(await readJson(request));
    const product = await createProduct(user.id, body);

    return created(product);
  } catch (error) {
    return errorResponse(error);
  }
}
