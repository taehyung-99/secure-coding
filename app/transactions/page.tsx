import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  isTransactionActionRequiredForUser,
  listTransactions,
} from "@/services/transaction.service";

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

export default async function TransactionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const transactions = await listTransactions(user);

  return (
    <main className="page-shell max-w-5xl">
      <Link href="/products" className="eyebrow-link">
        상품 목록으로
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-brand-text">거래 목록</h1>
      <p className="mt-2 text-sm text-gray-600">
        요청부터 모의 결제, 완료까지 거래 상태를 확인할 수 있습니다.
      </p>

      <section className="mt-8 grid gap-3">
        {transactions.map((transaction) => {
          const requiresAction = isTransactionActionRequiredForUser(
            transaction,
            user,
          );

          return (
            <Link
              key={transaction.id}
              href={`/transactions/${transaction.id}`}
              className="surface surface-hover p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-brand-text">
                      {transaction.product.title}
                    </p>
                    {requiresAction ? (
                      <span className="rounded-full bg-brand-accent px-2.5 py-1 text-xs font-bold text-brand-text">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-lg font-bold text-brand-primary">
                    {transaction.amount.toLocaleString("ko-KR")}원
                  </p>
                  {requiresAction ? (
                    <p className="mt-2 text-xs font-semibold text-brand-primary">
                      다음 진행을 위해 확인이 필요합니다.
                    </p>
                  ) : null}
                </div>
                <span className="status-badge-green">
                  {statusLabels[transaction.status]}
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {transactions.length === 0 ? (
        <div className="surface mt-8 p-8 text-center text-sm text-slate-600">
          아직 거래 내역이 없습니다.
        </div>
      ) : null}
    </main>
  );
}
