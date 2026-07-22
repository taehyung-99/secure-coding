import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import { getCurrentUser } from "@/lib/session";
import { listCategories } from "@/services/category.service";
import { getProductDetail } from "@/services/product.service";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    listCategories(),
  ]);
  const product = await getProductDetail(id, user).catch(() => null);

  if (!product || !product.canManage) {
    notFound();
  }

  return (
    <main className="page-shell max-w-2xl">
      <Link
        href={`/products/${product.id}`}
        className="eyebrow-link"
      >
        상세로 돌아가기
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-market-ink">상품 수정</h1>
      <div className="surface mt-8 p-5">
        <ProductForm
          categories={categories}
          mode="edit"
          initialValue={{
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price,
            region: product.region,
            categoryId: product.category?.id ?? null,
            imageUrl: product.images[0]?.url ?? null,
          }}
        />
      </div>
    </main>
  );
}
