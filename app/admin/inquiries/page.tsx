import { redirect } from "next/navigation";
import { AdminInquiryForm } from "@/components/admin/AdminInquiryForm";
import { AdminNav } from "@/components/admin/AdminNav";
import { getCurrentUser } from "@/lib/session";
import { listAdminInquiries } from "@/services/inquiry.service";

export const dynamic = "force-dynamic";

const inquiryStatusLabels: Record<string, string> = {
  OPEN: "접수",
  IN_PROGRESS: "검토중",
  ANSWERED: "답변완료",
  CLOSED: "종료",
};

export default async function AdminInquiriesPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    redirect("/products");
  }

  const inquiries = await listAdminInquiries();

  return (
    <main className="page-shell max-w-6xl">
      <AdminNav />
      <p className="mt-6 text-sm font-semibold text-market-steel">Admin</p>
      <h1 className="mt-1 text-3xl font-bold text-market-ink">문의 관리</h1>
      <section className="mt-8 grid gap-3">
        {inquiries.length === 0 ? (
          <p className="surface p-4 text-sm text-slate-500">
            접수된 문의가 없습니다.
          </p>
        ) : (
          inquiries.map((inquiry) => (
            <article key={inquiry.id} className="surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-market-ink">{inquiry.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {inquiry.content}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    작성자 @{inquiry.user.username}
                    {inquiry.user.profile?.nickname ? ` (${inquiry.user.profile.nickname})` : ""} ·{" "}
                    {inquiry.createdAt.toLocaleString("ko-KR")}
                  </p>
                </div>
                <span className="status-badge-green">
                  {inquiryStatusLabels[inquiry.status]}
                </span>
              </div>
              <AdminInquiryForm
                inquiryId={inquiry.id}
                currentStatus={inquiry.status}
                currentReply={inquiry.adminReply}
              />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
