import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle, UserRound } from "lucide-react";
import { RealtimeChat } from "@/components/chat/RealtimeChat";
import { RefreshAfterRead } from "@/components/chat/RefreshAfterRead";
import { getCurrentUser } from "@/lib/session";
import { getChatRoom, listMessages } from "@/services/chat.service";

export const dynamic = "force-dynamic";

type ChatRoomDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getDisplayName(user: {
  username: string;
  profile: { nickname: string | null } | null;
} | null) {
  if (!user) {
    return "채팅 상대";
  }

  return user.profile?.nickname ?? user.username;
}

export default async function ChatRoomDetailPage({
  params,
}: ChatRoomDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const room = await getChatRoom(user, id).catch(() => null);

  if (!room) {
    notFound();
  }

  const messages = await listMessages(user, room.id);
  const otherUser = room.userOneId === user.id ? room.userTwo : room.userOne;

  return (
    <main className="page-shell max-w-4xl">
      <RefreshAfterRead refreshKey={room.id} />
      <Link href="/chatrooms" className="eyebrow-link">
        채팅 목록으로
      </Link>

      <section className="surface mt-6 overflow-hidden">
        <header className="border-b border-gray-200 bg-brand-background p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-secondary text-brand-primary">
                {otherUser?.profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={otherUser.profile.avatarUrl}
                    alt={`${getDisplayName(otherUser)} 프로필 이미지`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={20} aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-brand-text">
                  {getDisplayName(otherUser)}
                </h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600">
                  <MessageCircle size={15} aria-hidden />
                  {room.type === "PRODUCT"
                    ? room.product?.title ?? "상품 채팅"
                    : "1:1 채팅"}
                </p>
              </div>
            </div>
            {otherUser ? (
              <Link
                href={`/users/${otherUser.id}`}
                className="btn-secondary shrink-0"
              >
                상대 프로필 보기
              </Link>
            ) : null}
          </div>
        </header>

        <RealtimeChat
          chatRoomId={room.id}
          currentUserId={user.id}
          initialMessages={messages}
        />
      </section>
    </main>
  );
}
