import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe2, MessageCircle, Package, UserRound } from "lucide-react";
import { DirectChatStarter } from "@/components/chat/DirectChatStarter";
import { getCurrentUser } from "@/lib/session";
import { listChatRooms } from "@/services/chat.service";

export const dynamic = "force-dynamic";

function getDisplayName(user: {
  username: string;
  profile: { nickname: string | null } | null;
} | null) {
  if (!user) {
    return "전체 유저 채팅";
  }

  return user.profile?.nickname ?? user.username;
}

export default async function ChatRoomsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userId = user.id;
  const chatRooms = await listChatRooms(user);
  const directRooms = chatRooms.filter((room) => room.type === "DIRECT");
  const productRooms = chatRooms.filter((room) => room.type === "PRODUCT");

  function renderRoomList(rooms: typeof chatRooms) {
    if (rooms.length === 0) {
      return (
        <div className="surface p-6 text-center text-sm text-slate-600">
          아직 기록이 없습니다.
        </div>
      );
    }

    return rooms.map((room) => {
      const otherUser = room.userOneId === userId ? room.userTwo : room.userOne;
      const lastMessage = room.messages[0];
      const isProductRoom = room.type === "PRODUCT";

      return (
        <Link
          key={room.id}
          href={`/chatrooms/${room.id}`}
          className="surface surface-hover block p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-secondary text-brand-primary">
                {otherUser?.profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={otherUser.profile.avatarUrl}
                    alt={`${getDisplayName(otherUser)} 프로필 이미지`}
                    className="h-full w-full object-cover"
                  />
                ) : isProductRoom ? (
                  <Package size={19} aria-hidden />
                ) : (
                  <UserRound size={19} aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-brand-text">
                  {getDisplayName(otherUser)}
                </p>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {isProductRoom
                    ? room.product?.title ?? "상품 채팅"
                    : "1:1 채팅"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {room.unreadCount > 0 ? (
                <span className="rounded-full bg-brand-accent px-2.5 py-1 text-xs font-bold text-brand-text">
                  New {room.unreadCount}
                </span>
              ) : null}
              <span className="status-badge-green">
                {isProductRoom ? "상품" : "1:1"}
              </span>
            </div>
          </div>
          <p className="mt-3 line-clamp-1 text-sm text-slate-700">
            {lastMessage?.content ?? "아직 메시지가 없습니다."}
          </p>
        </Link>
      );
    });
  }

  return (
    <main className="page-shell max-w-4xl">
      <Link href="/products" className="eyebrow-link">
        상품 목록으로
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-brand-text">채팅 목록</h1>
      <p className="mt-2 text-sm text-slate-600">
        MVP에서는 새로고침 기반으로 메시지를 저장하고 조회합니다.
      </p>

      <div className="mt-8">
        <DirectChatStarter />
      </div>

      <section className="mt-8 grid gap-3">
        <h2 className="text-lg font-bold text-brand-text">전체 유저 채팅</h2>
        <Link
          href="/chatrooms/global"
          className="surface surface-hover block border-brand-primary/20 bg-brand-secondary p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-primary">
                <Globe2 size={20} aria-hidden />
              </span>
              <div>
              <p className="font-semibold text-brand-text">전체 유저 채팅</p>
              <p className="mt-1 text-sm text-slate-700">
                로그인한 모든 사용자가 함께 이야기할 수 있는 공용 공간입니다.
              </p>
              </div>
            </div>
            <span className="status-badge bg-white text-brand-primary">
              공용
            </span>
          </div>
        </Link>
      </section>

      <section className="mt-8 grid gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-text">
          <MessageCircle size={19} aria-hidden className="text-brand-primary" />
          1:1 채팅
        </h2>
        {renderRoomList(directRooms)}
      </section>

      <section className="mt-8 grid gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-text">
          <Package size={19} aria-hidden className="text-brand-primary" />
          상품 채팅
        </h2>
        {renderRoomList(productRooms)}
      </section>
    </main>
  );
}
