import { created, errorResponse } from "@/lib/http";
import { assertRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { requireCurrentUser } from "@/lib/session";
import { storeProfileImage } from "@/lib/upload";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    await assertRateLimit({
      key: `upload:profile-image:${user.id}`,
      ...rateLimitPolicies.uploadImage,
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("업로드할 이미지 파일을 선택해 주세요.", 400);
    }

    const image = await storeProfileImage(file);

    return created(image);
  } catch (error) {
    return errorResponse(error);
  }
}
