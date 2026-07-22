import Link from "next/link";
import type { ReactNode } from "react";
import {
  HelpCircle,
  MessageCircle,
  PlusCircle,
  ReceiptText,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Logo } from "@/components/ui/Logo";
import { getCurrentUser } from "@/lib/session";
import { countChatNotifications } from "@/services/chat.service";
import { countAdminInquiryNotifications } from "@/services/inquiry.service";
import { countTransactionNotifications } from "@/services/transaction.service";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute right-1 top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-accent px-1.5 py-0.5 text-xs font-bold text-brand-text sm:static sm:ml-1">
      {count}
    </span>
  );
}

function NavLink({
  href,
  label,
  icon,
  count = 0,
  isPrimary = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  count?: number;
  isPrimary?: boolean;
}) {
  return (
    <Link
      aria-label={label}
      className={`relative inline-flex h-16 w-[4.5rem] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-semibold sm:h-auto sm:w-auto sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm ${
        isPrimary
          ? "bg-brand-primary text-white shadow-sm hover:bg-green-700"
          : "text-gray-700 hover:bg-brand-secondary hover:text-brand-text"
      }`}
      href={href}
    >
      {icon}
      <span className="whitespace-nowrap leading-none">{label}</span>
      <NavBadge count={count} />
    </Link>
  );
}

export async function AppNav() {
  const user = await getCurrentUser();
  const isActiveAdmin = user?.role === "ADMIN" && user.status === "ACTIVE";
  const [
    chatNotificationCount,
    transactionNotificationCount,
    inquiryNotificationCount,
  ] = user
    ? await Promise.all([
        countChatNotifications(user),
        countTransactionNotifications(user),
        isActiveAdmin ? countAdminInquiryNotifications() : Promise.resolve(0),
      ])
    : [0, 0, 0];

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-3 md:flex md:items-center md:justify-between md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between">
          <Logo href="/" />
        </div>
        <nav
          aria-label="주요 메뉴"
          className="flex w-full snap-x snap-mandatory items-center justify-start gap-1 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin] md:w-auto md:overflow-visible md:pb-0"
        >
          <NavLink href="/products" label="상품 보기" icon={<Store size={16} aria-hidden />} />
          {user ? (
            <>
              <NavLink href="/products/new" label="상품 등록" icon={<PlusCircle size={16} aria-hidden />} isPrimary />
              <NavLink
                href="/chatrooms"
                label="채팅"
                icon={<MessageCircle size={16} aria-hidden />}
                count={chatNotificationCount}
              />
              <NavLink
                href="/transactions"
                label="거래"
                icon={<ReceiptText size={16} aria-hidden />}
                count={transactionNotificationCount}
              />
              <NavLink
                href={isActiveAdmin ? "/admin/inquiries" : "/inquiries"}
                label="문의"
                icon={<HelpCircle size={16} aria-hidden />}
                count={inquiryNotificationCount}
              />
              <NavLink href="/my" label="마이페이지" icon={<User size={16} aria-hidden />} />
              {isActiveAdmin ? (
                <NavLink href="/admin" label="관리자" icon={<ShieldCheck size={16} aria-hidden />} />
              ) : null}
              <LogoutButton />
            </>
          ) : (
            <>
              <NavLink href="/auth/login" label="로그인" icon={<User size={16} aria-hidden />} />
              <NavLink href="/auth/signup" label="회원가입" icon={<PlusCircle size={16} aria-hidden />} isPrimary />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
