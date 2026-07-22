import { created, errorResponse, ok, readJson } from "@/lib/http";
import { assertRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { requireCurrentUser } from "@/lib/session";
import { createMessageSchema } from "@/lib/validators";
import {
  createGlobalMessage,
  listGlobalMessages,
} from "@/services/chat.service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const messages = await listGlobalMessages(user);

    return ok(messages);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = createMessageSchema.parse(await readJson(request));
    await assertRateLimit({
      key: `chat-message:${user.id}`,
      ...rateLimitPolicies.chatMessage,
    });
    const message = await createGlobalMessage(user, body.content);

    return created(message);
  } catch (error) {
    return errorResponse(error);
  }
}
