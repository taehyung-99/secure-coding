import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  BookOpen,
  Boxes,
  Grid3X3,
  Leaf,
  Shirt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { Logo } from "@/components/ui/Logo";
import { listCategories } from "@/services/category.service";
import { listProducts } from "@/services/product.service";

export const dynamic = "force-dynamic";

const categoryIcons: Record<string, LucideIcon> = {
  appliance: WashingMachine,
  books: BookOpen,
  clothes: Shirt,
  digital: Smartphone,
  furniture: Armchair,
};

export default async function HomePage() {
  const [categories, latestProducts] = await Promise.all([
    listCategories(),
    listProducts(
      {
        sort: "latest",
        page: 1,
        pageSize: 6,
      },
      null,
    ),
  ]);

  return (
    <main className="page-shell max-w-7xl">
      <section className="rounded-2xl border border-green-100 bg-brand-secondary px-5 py-8 shadow-card md:px-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Logo showEnglishName />
            <h1 className="mt-8 max-w-3xl text-3xl font-bold leading-tight text-brand-text md:text-5xl">
              전국의 이것저것을 쉽고 안전하게 거래해보세요
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              필요한 물건은 전국에서 찾고, 쓰지 않는 물건은 필요한 사람에게 연결하세요.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                상품 둘러보기
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/products/new" className="btn-secondary bg-white">
                상품 등록하기
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-card">
            <div className="grid gap-3">
              {[
                { icon: Boxes, title: "다양한 물건", body: "책, 의류, 디지털기기까지 전국의 물건을 한곳에서 확인" },
                { icon: ShieldCheck, title: "안전한 흐름", body: "신고, 차단, 관리자 관리 기능으로 신뢰 기반 거래" },
                { icon: Leaf, title: "재사용과 순환", body: "쓰지 않는 물건을 필요한 사람에게 자연스럽게 연결" },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl bg-brand-background p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/80 text-brand-text">
                    <item.icon size={19} aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-text">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div
          aria-label="인기 카테고리"
          className="mx-auto flex max-w-4xl snap-x snap-mandatory items-start justify-start gap-3 overflow-x-auto overscroll-x-contain px-1 pb-3 pt-2 [scrollbar-width:thin] sm:justify-center sm:gap-6"
        >
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? Grid3X3;

            return (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group grid w-24 shrink-0 snap-start grid-rows-[4rem_1.5rem] justify-items-center gap-2 rounded-2xl px-1 py-2 text-center focus-visible:outline-brand-primary"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white text-brand-primary shadow-card transition group-hover:-translate-y-0.5 group-hover:border-brand-primary/35 group-hover:bg-brand-secondary group-hover:shadow-lift">
                  <Icon size={26} aria-hidden />
                </span>
                <span className="flex h-6 items-center justify-center whitespace-nowrap text-xs font-semibold leading-none text-brand-text">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-primary">New Arrivals</p>
            <h2 className="mt-1 text-2xl font-bold text-brand-text">최신 상품</h2>
          </div>
          <Link href="/products" className="eyebrow-link items-center gap-1">
            전체 보기
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
        {latestProducts.items.length === 0 ? (
          <div className="empty-state mt-5">아직 등록된 상품이 없습니다.</div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestProducts.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="surface p-6">
          <p className="text-sm font-semibold text-brand-primary">Trust Guide</p>
          <h2 className="mt-1 text-2xl font-bold text-brand-text">안전 거래 안내</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "거래 전 상대 프로필과 상품 상태를 확인하세요.",
              "의심스러운 상품과 사용자는 신고하거나 차단할 수 있어요.",
              "모의 결제 흐름으로 거래 상태를 명확히 추적합니다.",
              "관리자는 신고, 상품, 거래 내역을 별도로 관리합니다.",
            ].map((text) => (
              <div key={text} className="flex gap-2 rounded-2xl bg-brand-background p-3 text-sm leading-6 text-gray-700">
                <Sparkles size={16} aria-hidden className="mt-1 shrink-0 text-brand-primary" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
