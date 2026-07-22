import { errorResponse, ok, readJson } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { updateMeSchema } from "@/lib/validators";
import {
  getMyProfile,
  updateMyPassword,
  updateMyProfile,
} from "@/services/user.service";

export async function GET() {
  try {
    const sessionUser = await requireCurrentUser();
    const user = await getMyProfile(sessionUser.id);

    return ok(user);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = await requireCurrentUser();
    const body = updateMeSchema.parse(await readJson(request));

    if (body.currentPassword && body.newPassword) {
      await updateMyPassword(sessionUser.id, {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
    }

    const user = await updateMyProfile(sessionUser.id, {
      nickname: body.nickname,
      region: body.region,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
    });

    return ok(user);
  } catch (error) {
    return errorResponse(error);
  }
}
