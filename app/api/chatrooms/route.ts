import { created, errorResponse, ok, readJson } from "@/lib/http";
import { requireCurrentUser } from "@/lib/session";
import { createChatRoomSchema } from "@/lib/validators";
import { createChatRoom, listChatRooms } from "@/services/chat.service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const chatRooms = await listChatRooms(user);

    return ok(chatRooms);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = createChatRoomSchema.parse(await readJson(request));
    const chatRoom = await createChatRoom(user, body);

    return created(chatRoom);
  } catch (error) {
    return errorResponse(error);
  }
}
