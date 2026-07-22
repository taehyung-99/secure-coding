import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe2 } from "lucide-react";
import { RealtimeChat } from "@/components/chat/RealtimeChat";
import { getCurrentUser } from "@/lib/session";
import {
  getOrCreateGlobalChatRoom,
  listMessages,
} from "@/services/chat.service";

export const dynamic = "force-dynamic";

export default async function GlobalChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const room = await getOrCreateGlobalChatRoom();
  const messages = await listMessages(user, room.id);

  return (
    <main className="page-shell max-w-4xl">
      <Link href="/chatrooms" className="eyebrow-link">
        채팅 목록으로
      </Link>

      <section className="surface mt-6 overflow-hidden">
        <header className="border-b border-gray-200 bg-brand-background p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-secondary text-brand-primary">
              <Globe2 size={21} aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold text-brand-text">전체 유저 채팅</h1>
              <p className="mt-1 text-sm text-slate-600">
                로그인한 모든 사용자가 참여할 수 있는 공용 공간입니다.
              </p>
            </div>
          </div>
        </header>

        <RealtimeChat
          chatRoomId={room.id}
          currentUserId={user.id}
          initialMessages={messages}
          showSenderName
        />
      </section>
    </main>
  );
}
