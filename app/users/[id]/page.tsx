import Link from "next/link";
import { notFound } from "next/navigation";
import { UserSafetyActions } from "@/components/safety/UserSafetyActions";
import { getCurrentUser } from "@/lib/session";
import { getPublicUserProfile } from "@/services/user.service";

export const dynamic = "force-dynamic";

const productStatusLabels: Record<string, string> = {
  ON_SALE: "판매중",
  RESERVED: "예약중",
  SOLD: "거래완료",
};

const userStatusLabels: Record<string, string> = {
  ACTIVE: "활성",
  SUSPENDED: "정지",
  DORMANT: "휴면",
  DELETED: "삭제",
};

type UserProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getDisplayName(user: {
  username: string;
  profile: { nickname: string | null } | null;
}) {
  return user.profile?.nickname ?? user.username;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const profileUser = await getPublicUserProfile(id, viewer).catch(() => null);

  if (!profileUser) {
    notFound();
  }

  const displayName = getDisplayName(profileUser);
  const canUseSafetyActions = Boolean(
    viewer &&
      viewer.status === "ACTIVE" &&
      viewer.id !== profileUser.id &&
      viewer.role !== "ADMIN",
  );

  return (
    <main className="page-shell max-w-5xl">
      <Link href="/products" className="eyebrow-link">
        상품 목록으로
      </Link>

      <section className="surface mt-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-lg font-bold text-slate-500">
              {profileUser.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileUser.profile.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                displayName.slice(0, 1)
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-market-ink">{displayName}</h1>
              <p className="mt-1 text-sm text-slate-500">@{profileUser.username}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="status-badge-green">
                  {userStatusLabels[profileUser.status]}
                </span>
                {profileUser.profile?.region ? (
                  <span className="status-badge-neutral">
                    {profileUser.profile.region}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            가입 {profileUser.createdAt.toLocaleDateString("ko-KR")}
          </p>
        </div>

        {profileUser.profile?.bio ? (
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {profileUser.profile.bio}
          </p>
        ) : (
          <p className="mt-5 text-sm text-slate-500">등록된 소개글이 없습니다.</p>
        )}

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="surface-muted p-3">
            <dt className="text-xs font-semibold text-slate-500">판매 상품</dt>
            <dd className="mt-1 text-xl font-bold text-market-ink">
              {profileUser._count.products.toLocaleString("ko-KR")}
            </dd>
          </div>
          <div className="surface-muted p-3">
            <dt className="text-xs font-semibold text-slate-500">구매 거래</dt>
            <dd className="mt-1 text-xl font-bold text-market-ink">
              {profileUser._count.buyerTransactions.toLocaleString("ko-KR")}
            </dd>
          </div>
          <div className="surface-muted p-3">
            <dt className="text-xs font-semibold text-slate-500">판매 거래</dt>
            <dd className="mt-1 text-xl font-bold text-market-ink">
              {profileUser._count.sellerTransactions.toLocaleString("ko-KR")}
            </dd>
          </div>
        </dl>

        {canUseSafetyActions ? (
          <div className="mt-6">
            <UserSafetyActions
              targetUserId={profileUser.id}
              canAct
              blockLabel="사용자 차단"
              initialBlocked={profileUser.blockedByMe}
            />
          </div>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-market-ink">판매 중인 상품</h2>
        {profileUser.products.length === 0 ? (
          <div className="surface mt-3 p-6 text-center text-sm text-slate-600">
            공개된 판매 상품이 없습니다.
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profileUser.products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="surface surface-hover overflow-hidden"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm text-slate-500">
                  {product.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.thumbnailUrl}
                      alt={product.images[0]?.altText ?? product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "이미지 없음"
                  )}
                </div>
                <div className="grid gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 font-semibold text-market-ink">
                      {product.title}
                    </p>
                    <span className="status-badge-green shrink-0">
                      {productStatusLabels[product.status]}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900">
                    {product.price.toLocaleString("ko-KR")}원
                  </p>
                  <p className="text-xs text-slate-500">
                    조회 {product.viewCount.toLocaleString("ko-KR")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
