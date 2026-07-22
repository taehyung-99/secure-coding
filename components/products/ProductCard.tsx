import Link from "next/link";

type ProductCardProduct = {
  id: string;
  title: string;
  price: number;
  region: string;
  status: "ON_SALE" | "RESERVED" | "SOLD";
  visibility?: "VISIBLE" | "BLOCKED" | "HIDDEN" | "DELETED";
  reportCount?: number;
  viewCount: number;
  createdAt: Date;
  thumbnailUrl: string | null;
  images: Array<{
    altText: string | null;
  }>;
};

type ProductCardProps = {
  product: ProductCardProduct;
  showOwnerMeta?: boolean;
};

const statusLabels = {
  ON_SALE: "판매중",
  RESERVED: "예약중",
  SOLD: "거래완료",
};

const visibilityLabels = {
  VISIBLE: "노출",
  BLOCKED: "차단",
  HIDDEN: "숨김",
  DELETED: "삭제",
};

export function ProductCard({ product, showOwnerMeta = false }: ProductCardProps) {
  const isBlocked = showOwnerMeta && product.visibility === "BLOCKED";

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-lift"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-gray-100 text-sm font-semibold text-gray-500">
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnailUrl}
            alt={product.images[0]?.altText ?? product.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          "이미지 없음"
        )}
      </div>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-base font-semibold text-brand-text">
            {product.title}
          </h2>
          <span className="status-badge-green shrink-0">
            {statusLabels[product.status]}
          </span>
        </div>

        {showOwnerMeta && product.visibility && product.visibility !== "VISIBLE" ? (
          <span className="w-fit rounded-full bg-brand-accent px-2.5 py-1 text-xs font-semibold text-brand-text">
            {visibilityLabels[product.visibility]}
          </span>
        ) : null}

        {isBlocked ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            신고 누적으로 차단된 상품입니다. 관리자 확인이 필요합니다.
          </p>
        ) : null}

        <p className="text-lg font-bold text-brand-primary">
          {product.price.toLocaleString("ko-KR")}원
        </p>
        <p className="text-sm font-medium text-gray-600">{product.region}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span>조회 {product.viewCount.toLocaleString("ko-KR")}</span>
          {showOwnerMeta && product.reportCount !== undefined ? (
            <span>신고 {product.reportCount.toLocaleString("ko-KR")}</span>
          ) : null}
          <span>게시 {new Date(product.createdAt).toLocaleString("ko-KR")}</span>
        </div>
      </div>
    </Link>
  );
}
