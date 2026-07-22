import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminStatusForm } from "@/components/admin/AdminStatusForm";
import { getCurrentUser } from "@/lib/session";
import { listAdminUsers } from "@/services/admin.service";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  ACTIVE: "활성",
  SUSPENDED: "정지",
  DORMANT: "휴면",
  DELETED: "삭제",
};

const userStatusOptions = [
  { value: "ACTIVE", label: "활성" },
  { value: "SUSPENDED", label: "정지" },
  { value: "DORMANT", label: "휴면" },
];

const userStatusSections = [
  { status: "ACTIVE", title: "활성 사용자" },
  { status: "SUSPENDED", title: "정지 사용자" },
  { status: "DORMANT", title: "휴면 사용자" },
  { status: "DELETED", title: "삭제 사용자" },
] as const;

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    redirect("/products");
  }

  const users = await listAdminUsers();

  return (
    <main className="page-shell max-w-6xl">
      <AdminNav />
      <p className="mt-6 text-sm font-semibold text-brand-primary">Admin</p>
      <h1 className="mt-1 text-3xl font-bold text-brand-text">사용자 관리</h1>
      <div className="mt-8 grid gap-8">
        {userStatusSections.map((section) => {
          const sectionUsers = users.filter((item) => item.status === section.status);

          return (
            <section key={section.status} className="surface overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-brand-background px-5 py-4">
                <h2 className="text-lg font-bold text-brand-text">{section.title}</h2>
                <span className="status-badge-neutral">
                  {sectionUsers.length.toLocaleString("ko-KR")}명
                </span>
              </div>
              {sectionUsers.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  해당 상태의 사용자가 없습니다.
                </p>
              ) : (
                sectionUsers.map((item) => (
                  <article key={item.id} className="border-b border-gray-100 p-5 last:border-b-0">
                    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-start">
                      <div>
                        <p className="font-semibold text-brand-text">
                          {item.profile?.nickname ?? item.username}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          @{item.username} · {item.email}
                        </p>
                      </div>
                      <p className="text-xs leading-6 text-slate-500">
                        상품 {item._count.products} · 신고 {item._count.reportsReceived} ·
                        구매거래 {item._count.buyerTransactions} · 판매거래{" "}
                        {item._count.sellerTransactions}
                      </p>
                      <div className="lg:text-right">
                        <span className="status-badge-green">
                          {item.role} · {statusLabels[item.status]}
                        </span>
                      </div>
                    </div>
                    <AdminStatusForm
                      endpoint={`/api/admin/users/${item.id}/status`}
                      fieldName="status"
                      currentValue={item.status === "DELETED" ? "DORMANT" : item.status}
                      options={userStatusOptions}
                      buttonLabel="상태 변경"
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
