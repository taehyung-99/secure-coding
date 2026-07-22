import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TransactionActions } from "@/components/transactions/TransactionActions";
import { getCurrentUser } from "@/lib/session";
import { getTransaction } from "@/services/transaction.service";

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

const transactionSteps = [
  { status: "REQUESTED", label: "요청" },
  { status: "ACCEPTED", label: "수락" },
  { status: "PAYMENT_PENDING", label: "결제대기" },
  { status: "PAID", label: "결제완료" },
  { status: "COMPLETED", label: "완료" },
] as const;

type TransactionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getDisplayName(user: {
  username: string;
  profile: { nickname: string | null } | null;
}) {
  return user.profile?.nickname ?? user.username;
}

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const transaction = await getTransaction(user, id).catch(() => null);

  if (!transaction) {
    notFound();
  }

  const isBuyer = transaction.buyerId === user.id || user.role === "ADMIN";
  const isSeller = transaction.sellerId === user.id || user.role === "ADMIN";
  const currentStepIndex = transactionSteps.findIndex(
    (step) => step.status === transaction.status,
  );
  const isStopped = ["CANCELED", "REJECTED"].includes(transaction.status);

  return (
    <main className="page-shell max-w-4xl">
      <Link
        href="/transactions"
        className="eyebrow-link"
      >
        거래 목록으로
      </Link>

      <section className="surface mt-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">
              {transaction.product.title}
            </h1>
            <p className="mt-2 text-2xl font-bold text-brand-primary">
              {transaction.amount.toLocaleString("ko-KR")}원
            </p>
          </div>
          <span className={isStopped ? "status-badge-red" : "status-badge-green"}>
            {statusLabels[transaction.status]}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-brand-primary/20 bg-brand-secondary p-4">
          <p className="text-sm font-semibold text-brand-text">거래 진행 단계</p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-5">
            {transactionSteps.map((step, index) => {
              const isDone = !isStopped && currentStepIndex >= index;
              const isCurrent = !isStopped && currentStepIndex === index;

              return (
                <li
                  key={step.status}
                  className={`rounded-2xl border px-3 py-3 text-center text-xs font-bold ${
                    isDone
                      ? "border-brand-primary bg-white text-brand-primary"
                      : "border-gray-200 bg-white/70 text-gray-500"
                  } ${isCurrent ? "shadow-sm ring-2 ring-brand-primary/20" : ""}`}
                >
                  <span className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-current text-[11px]">
                    <span className={isDone ? "text-white" : "text-white"}>
                      {index + 1}
                    </span>
                  </span>
                  {step.label}
                </li>
              );
            })}
          </ol>
          {isStopped ? (
            <p className="mt-3 text-sm font-medium text-red-700">
              이 거래는 {statusLabels[transaction.status]} 상태로 종료되었습니다.
            </p>
          ) : null}
        </div>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-900">구매자</dt>
            <dd className="mt-1 text-slate-600">
              <Link
                href={`/users/${transaction.buyerId}`}
                className="font-semibold text-market-leaf"
              >
                {getDisplayName(transaction.buyer)}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">판매자</dt>
            <dd className="mt-1 text-slate-600">
              <Link
                href={`/users/${transaction.sellerId}`}
                className="font-semibold text-market-leaf"
              >
                {getDisplayName(transaction.seller)}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">결제 상태</dt>
            <dd className="mt-1 text-slate-600">
              {transaction.payment?.status ?? "결제 전"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">결제 수단</dt>
            <dd className="mt-1 text-slate-600">
              {transaction.payment?.method ?? "없음"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          현재 결제는 MVP용 모의 결제입니다. 실제 금융 결제나 송금은 발생하지 않습니다.
        </div>

        <div className="mt-6">
          <TransactionActions
            transactionId={transaction.id}
            status={transaction.status}
            isBuyer={isBuyer}
            isSeller={isSeller}
          />
        </div>
      </section>
    </main>
  );
}
