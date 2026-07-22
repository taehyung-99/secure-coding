import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminStatusForm } from "@/components/admin/AdminStatusForm";
import { getCurrentUser } from "@/lib/session";
import { listAdminProducts } from "@/services/admin.service";

export const dynamic = "force-dynamic";

const visibilityLabels: Record<string, string> = {
  VISIBLE: "노출",
  HIDDEN: "숨김",
  BLOCKED: "차단",
  DELETED: "삭제",
};

const visibilityOptions = [
  { value: "VISIBLE", label: "노출" },
  { value: "HIDDEN", label: "숨김" },
  { value: "BLOCKED", label: "차단" },
  { value: "DELETED", label: "삭제" },
];

const visibilitySections = [
  { visibility: "VISIBLE", title: "노출 상품" },
  { visibility: "HIDDEN", title: "숨김 상품" },
  { visibility: "BLOCKED", title: "차단 상품" },
  { visibility: "DELETED", title: "삭제 상품" },
] as const;

export default async function AdminProductsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    redirect("/products");
  }

  const products = await listAdminProducts();

  return (
    <main className="page-shell max-w-6xl">
      <AdminNav />
      <p className="mt-6 text-sm font-semibold text-brand-primary">Admin</p>
      <h1 className="mt-1 text-3xl font-bold text-brand-text">상품 관리</h1>
      <div className="mt-8 grid gap-8">
        {visibilitySections.map((section) => {
          const sectionProducts = products.filter(
            (product) => product.visibility === section.visibility,
          );

          return (
            <section key={section.visibility} className="surface overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-brand-background px-5 py-4">
                <h2 className="text-lg font-bold text-brand-text">{section.title}</h2>
                <span className="status-badge-neutral">
                  {sectionProducts.length.toLocaleString("ko-KR")}개
                </span>
              </div>
              {sectionProducts.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  해당 상태의 상품이 없습니다.
                </p>
              ) : (
                sectionProducts.map((product) => (
                  <article key={product.id} className="border-b border-gray-100 p-5 last:border-b-0">
                    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-start">
                      <div>
                        <p className="font-semibold text-brand-text">{product.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {product.price.toLocaleString("ko-KR")}원 · {product.region} ·{" "}
                          {product.category?.name ?? "미분류"}
                        </p>
                      </div>
                      <p className="text-xs leading-6 text-slate-500">
                        판매자 @{product.seller.username} · 신고 {product.reportCount}
                      </p>
                      <div className="lg:text-right">
                        <span className="status-badge-green">
                          {product.status} · {visibilityLabels[product.visibility]}
                        </span>
                      </div>
                    </div>
                    <AdminStatusForm
                      endpoint={`/api/admin/products/${product.id}/visibility`}
                      fieldName="visibility"
                      currentValue={product.visibility}
                      options={visibilityOptions}
                      buttonLabel="노출 변경"
                    />
                  </article>
                ))
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
