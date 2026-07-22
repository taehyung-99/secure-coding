import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Eye, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { StartProductChatButton } from "@/components/chat/StartProductChatButton";
import { ProductDeleteButton } from "@/components/products/ProductDeleteButton";
import { ProductStatusControl } from "@/components/products/ProductStatusControl";
import { ProductReportForm } from "@/components/safety/ProductReportForm";
import { UserSafetyActions } from "@/components/safety/UserSafetyActions";
import { TransactionRequestButton } from "@/components/transactions/TransactionRequestButton";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/session";
import { getProductDetail } from "@/services/product.service";

export const dynamic = "force-dynamic";

const statusLabels = {
  ON_SALE: "판매중",
  RESERVED: "예약중",
  SOLD: "거래완료",
};

type ProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const product = await getProductDetail(id, user).catch((error) => {
    if (error instanceof AppError && error.message === "차단된 사용자의 상품입니다.") {
      redirect("/products?notice=blocked-user-product");
    }

    return null;
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="page-shell max-w-5xl">
      <Link href="/products" className="eyebrow-link items-center gap-1">
        <ArrowLeft size={16} aria-hidden />
        상품 목록으로
      </Link>

      <section className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface overflow-hidden">
          <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].altText ?? product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              "이미지 없음"
            )}
          </div>
        </div>

        <div className="grid content-start gap-5">
          <section className="surface p-5">
            <div className="flex flex-wrap gap-2">
              <span className="status-badge-green">
                {statusLabels[product.status]}
              </span>
              {product.category ? (
                <span className="status-badge-neutral">
                  {product.category.name}
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-brand-text">
              {product.title}
            </h1>
            <p className="mt-3 text-3xl font-bold text-brand-primary">
              {product.price.toLocaleString("ko-KR")}원
            </p>
            <div className="mt-5 grid gap-2 rounded-2xl bg-brand-background p-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} aria-hidden className="text-brand-primary" />
                {product.region}
              </span>
              <span className="inline-flex items-center gap-2">
                <Eye size={16} aria-hidden className="text-brand-primary" />
                조회 {product.viewCount.toLocaleString("ko-KR")}
              </span>
              <span>
                게시 {new Date(product.createdAt).toLocaleString("ko-KR")}
              </span>
            </div>
          </section>

          <Link
            href={`/users/${product.sellerId}`}
            className="surface surface-hover block p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-secondary text-brand-primary">
                {product.seller.profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.seller.profile.avatarUrl}
                    alt={`${product.seller.profile?.nickname ?? product.seller.username} 프로필 이미지`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={19} aria-hidden />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-text">
                  {product.seller.profile?.nickname ?? product.seller.username}
                </p>
                <p className="mt-1 text-sm text-gray-600">판매 지역 {product.region}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
                  <ShieldCheck size={14} aria-hidden />
                  판매자 프로필 보기
                </p>
              </div>
            </div>
          </Link>

          {product.canManage ? (
            <div className="surface grid gap-3 p-4">
              <ProductStatusControl
                productId={product.id}
                currentStatus={product.status}
              />
              <Link
                href={`/products/${product.id}/edit`}
                className="btn-secondary"
              >
                상품 수정
              </Link>
              <ProductDeleteButton productId={product.id} />
            </div>
          ) : null}

          {!product.canManage ? (
            <>
              {user ? <StartProductChatButton productId={product.id} /> : null}
              {user ? <TransactionRequestButton productId={product.id} /> : null}
              <UserSafetyActions
                targetUserId={product.sellerId}
                canAct={Boolean(user)}
              />
            </>
          ) : null}
        </div>
      </section>

      <section className="surface mt-8 p-6">
        <h2 className="text-lg font-bold text-brand-text">상품 설명</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {product.description}
        </p>
      </section>

      {!product.canManage && user ? (
        <section className="mt-8">
          <ProductReportForm productId={product.id} />
        </section>
      ) : null}
    </main>
  );
}
