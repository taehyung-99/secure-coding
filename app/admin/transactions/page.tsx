import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getCurrentUser } from "@/lib/session";
import { listAdminTransactions } from "@/services/admin.service";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  REQUESTED: "요청됨",
  ACCEPTED: "수락됨",
  PAYMENT_PENDING: "결제대기",
  PAID: "결제완료",
  COMPLETED: "거래완료",
  CANCELED: "취소됨",
  REJECTED: "거절됨",
};

export default async function AdminTransactionsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    redirect("/products");
  }

  const transactions = await listAdminTransactions();

  return (
    <main className="page-shell max-w-6xl">
      <AdminNav />
      <p className="mt-6 text-sm font-semibold text-market-steel">Admin</p>
      <h1 className="mt-1 text-3xl font-bold text-market-ink">거래 관리</h1>
      <section className="mt-8 grid gap-3">
        {transactions.map((transaction) => (
          <article key={transaction.id} className="surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-market-ink">
                  {transaction.product.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {transaction.amount.toLocaleString("ko-KR")}원 · 구매자 @
                  {transaction.buyer.username} · 판매자 @{transaction.seller.username}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  결제 {transaction.payment?.status ?? "없음"}
                </p>
              </div>
              <span className="status-badge-green">
                {statusLabels[transaction.status]}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
