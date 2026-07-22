import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { productListQuerySchema } from "@/lib/validators";
import { getCurrentUser } from "@/lib/session";
import { listCategories } from "@/services/category.service";
import { listProducts } from "@/services/product.service";

export const dynamic = "force-dynamic";

const noticeMessages: Record<string, string> = {
  "blocked-user-product": "차단된 사용자의 상품입니다.",
};

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const query = productListQuerySchema.parse({
    q: readParam(params.q),
    category: readParam(params.category),
    region: readParam(params.region),
    status: readParam(params.status),
    sort: readParam(params.sort),
    seller: readParam(params.seller),
    page: readParam(params.page),
    pageSize: readParam(params.pageSize),
  });
  const notice = readParam(params.notice);
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    listCategories(),
  ]);
  const products = await listProducts(query, user);

  return (
    <main className="page-shell max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-primary">
            This &amp; That Market
          </p>
          <h1 className="mt-1 text-3xl font-bold text-brand-text">
            {query.seller === "me" ? "내 상품 관리" : "상품 목록"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            전체 목록은 간단한 상품 정보만 보여주고, 상세 정보는 클릭 후 확인합니다.
          </p>
        </div>
        <Link
          href="/products/new"
          className="btn-primary"
        >
          <PlusCircle size={16} aria-hidden />
          상품 등록
        </Link>
      </div>

      {notice && noticeMessages[notice] ? (
        <div className="mt-6 rounded-2xl border border-brand-accent/60 bg-yellow-50 px-4 py-3 text-sm font-semibold text-brand-text">
          {noticeMessages[notice]}
        </div>
      ) : null}

      <form className="surface mt-8 grid gap-3 p-4 sm:grid-cols-5">
        {query.seller === "me" ? (
          <input type="hidden" name="seller" value="me" />
        ) : null}
        <input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="상품명 검색"
          className="field"
        />
        <select
          name="category"
          defaultValue={query.category ?? ""}
          className="field"
        >
          <option value="">전체 카테고리</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          name="region"
          defaultValue={query.region ?? ""}
          placeholder="지역 검색"
          className="field"
        />
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="field"
        >
          <option value="">전체 상태</option>
          {Object.entries({
            ON_SALE: "판매중",
            RESERVED: "예약중",
            SOLD: "거래완료",
          }).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={query.sort}
          className="field"
        >
          <option value="latest">최신순</option>
          <option value="price_asc">낮은 가격순</option>
          <option value="price_desc">높은 가격순</option>
          <option value="view_desc">조회수 많은 순</option>
          <option value="view_asc">조회수 적은 순</option>
        </select>
        <button
          type="submit"
          className="btn-dark sm:col-span-5"
        >
          <Search size={16} aria-hidden />
          검색
        </button>
      </form>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showOwnerMeta={query.seller === "me"}
          />
        ))}
      </section>

      {products.items.length === 0 ? (
        <div className="empty-state mt-8">
          조건에 맞는 상품이 없습니다.
        </div>
      ) : null}
    </main>
  );
}
