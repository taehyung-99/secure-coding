import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import { getCurrentUser } from "@/lib/session";
import { listCategories } from "@/services/category.service";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    listCategories(),
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="page-shell max-w-2xl">
      <Link href="/products" className="eyebrow-link">
        상품 목록으로
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-market-ink">상품 등록</h1>
      <p className="mt-2 text-sm text-slate-600">
        로그인한 사용자만 상품을 등록할 수 있습니다.
      </p>
      <div className="surface mt-8 p-5">
        <ProductForm categories={categories} mode="create" />
      </div>
    </main>
  );
}
