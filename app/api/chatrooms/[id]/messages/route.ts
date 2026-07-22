import { created, errorResponse, ok, readJson } from "@/lib/http";
import { assertRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { requireCurrentUser } from "@/lib/session";
import { createMessageSchema } from "@/lib/validators";
import { createMessage, listMessages } from "@/services/chat.service";

type ChatMessagesRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: ChatMessagesRouteContext) {
  try {
    const { id } = await context.params;
    const user = await requireCurrentUser();
    const messages = await listMessages(user, id);

    return ok(messages);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: ChatMessagesRouteContext) {
  try {
    const { id } = await context.params;
    const user = await requireCurrentUser();
    const body = createMessageSchema.parse(await readJson(request));
    await assertRateLimit({
      key: `chat-message:${user.id}`,
      ...rateLimitPolicies.chatMessage,
    });
    const message = await createMessage(user, id, body.content);

    return created(message);
  } catch (error) {
    return errorResponse(error);
  }
}
