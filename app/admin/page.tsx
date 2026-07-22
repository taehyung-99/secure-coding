import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getCurrentUser } from "@/lib/session";
import { getAdminDashboard } from "@/services/admin.service";

export const dynamic = "force-dynamic";

const metricLabels = [
  ["users", "전체 사용자", "/admin/users"],
  ["suspendedUsers", "정지 사용자", "/admin/users"],
  ["dormantUsers", "휴면 사용자", "/admin/users"],
  ["visibleProducts", "노출 상품", "/admin/products"],
  ["blockedProducts", "차단 상품", "/admin/products"],
  ["pendingReports", "처리 대기 신고", "/admin/reports"],
  ["openInquiries", "처리 대기 문의", "/admin/inquiries"],
  ["transactions", "전체 거래", "/admin/transactions"],
  ["paidTransactions", "결제/완료 거래", "/admin/transactions"],
] as const;

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    redirect("/products");
  }

  const dashboard = await getAdminDashboard();

  return (
    <main className="page-shell max-w-6xl">
      <AdminNav />
      <p className="mt-6 text-sm font-semibold text-brand-primary">Admin</p>
      <h1 className="mt-1 text-3xl font-bold text-brand-text">관리자 대시보드</h1>
      <p className="mt-2 text-sm text-gray-600">
        사용자, 상품, 신고, 문의, 거래 상태를 빠르게 확인합니다.
      </p>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricLabels.map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            className="surface surface-hover p-5"
          >
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-3 text-3xl font-bold text-brand-text">
              {dashboard[key].toLocaleString("ko-KR")}
            </p>
            <p className="mt-3 text-xs font-semibold text-brand-primary">관리 화면으로 이동</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
