import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { ProfileAccessGate } from "@/components/users/ProfileAccessGate";
import { ProfileForm } from "@/components/users/ProfileForm";
import { getCurrentUser } from "@/lib/session";
import { getMyProfile } from "@/services/user.service";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  const user = await getMyProfile(sessionUser.id);

  return (
    <main className="page-shell max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-market-ink">마이페이지</h1>
          <p className="mt-2 text-sm text-slate-600">
            @{user.username} · {user.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products?seller=me"
            className="btn-secondary"
          >
            내 상품
          </Link>
          <Link
            href="/my/blocks"
            className="btn-secondary"
          >
            차단 목록
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="surface p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-secondary text-brand-primary">
              {user.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile.avatarUrl}
                  alt={`${user.profile?.nickname ?? user.username} 프로필 이미지`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={30} aria-hidden />
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500">계정 상태</p>
              <p className="mt-2 text-lg font-bold text-market-ink">
                {user.role} · {user.status}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {user.profile?.bio ?? "등록된 소개가 없습니다."}
          </p>
        </div>
        <div className="surface p-5">
          <ProfileAccessGate>
            <ProfileForm
              initialValue={{
                nickname: user.profile?.nickname ?? user.username,
                region: user.profile?.region,
                bio: user.profile?.bio,
                avatarUrl: user.profile?.avatarUrl,
              }}
            />
          </ProfileAccessGate>
        </div>
      </section>
    </main>
  );
}
