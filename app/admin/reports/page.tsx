import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminStatusForm } from "@/components/admin/AdminStatusForm";
import { getCurrentUser } from "@/lib/session";
import { listAdminReports } from "@/services/admin.service";

export const dynamic = "force-dynamic";

const reportStatusLabels: Record<string, string> = {
  PENDING: "대기중",
  REVIEWING: "검토중",
  RESOLVED: "처리완료",
  REJECTED: "기각",
};

const reportStatusOptions = [
  { value: "PENDING", label: "대기중" },
  { value: "REVIEWING", label: "검토중" },
  { value: "RESOLVED", label: "처리완료" },
  { value: "REJECTED", label: "기각" },
];

export default async function AdminReportsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    redirect("/products");
  }

  const reports = await listAdminReports();

  return (
    <main className="page-shell max-w-6xl">
      <AdminNav />
      <p className="mt-6 text-sm font-semibold text-market-steel">Admin</p>
      <h1 className="mt-1 text-3xl font-bold text-market-ink">신고 관리</h1>
      <section className="mt-8 grid gap-3">
        {reports.map((report) => (
          <article key={report.id} className="surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-market-ink">
                  {report.targetType === "USER"
                    ? `사용자 신고: @${report.targetUser?.username ?? "알 수 없음"}`
                    : `상품 신고: ${report.targetProduct?.title ?? "알 수 없음"}`}
                </p>
                <p className="mt-1 text-sm text-slate-600">사유: {report.reason}</p>
                {report.detail ? (
                  <p className="mt-2 text-sm text-slate-500">{report.detail}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  신고자 @{report.reporter.username}
                </p>
              </div>
              <span className="status-badge-green">
                {reportStatusLabels[report.status]}
              </span>
            </div>
            <AdminStatusForm
              endpoint={`/api/admin/reports/${report.id}`}
              fieldName="status"
              currentValue={report.status}
              options={reportStatusOptions}
              buttonLabel="처리 변경"
            />
          </article>
        ))}
      </section>
    </main>
  );
}
