import { errorResponse, ok } from "@/lib/http";
import { listCategories } from "@/services/category.service";

export async function GET() {
  try {
    const categories = await listCategories();

    return ok(categories);
  } catch (error) {
    return errorResponse(error);
  }
}
