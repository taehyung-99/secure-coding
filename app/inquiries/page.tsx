import { redirect } from "next/navigation";
import { InquiryForm } from "@/components/inquiries/InquiryForm";
import { getCurrentUser } from "@/lib/session";
import { listMyInquiries } from "@/services/inquiry.service";

export const dynamic = "force-dynamic";

const inquiryStatusLabels: Record<string, string> = {
  OPEN: "접수",
  IN_PROGRESS: "검토중",
  ANSWERED: "답변완료",
  CLOSED: "종료",
};

export default async function InquiriesPage() {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect("/auth/login");
  }

  const inquiries = await listMyInquiries(user.id);

  return (
    <main className="page-shell max-w-4xl">
      <h1 className="text-3xl font-bold text-market-ink">문의하기</h1>
      <p className="mt-2 text-sm text-slate-600">
        플랫폼 이용 중 도움이 필요한 내용을 관리자에게 남길 수 있습니다.
      </p>

      <section className="mt-6">
        <InquiryForm />
      </section>

      <section className="mt-8 grid gap-3">
        <h2 className="text-lg font-bold text-market-ink">내 문의 내역</h2>
        {inquiries.length === 0 ? (
          <p className="surface p-4 text-sm text-slate-500">
            접수한 문의가 없습니다.
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
                    {inquiry.createdAt.toLocaleString("ko-KR")}
                  </p>
                </div>
                <span className="status-badge-green">
                  {inquiryStatusLabels[inquiry.status]}
                </span>
              </div>
              {inquiry.adminReply ? (
                <div className="surface-muted mt-3 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-market-ink">관리자 답변</p>
                  <p className="mt-1 whitespace-pre-wrap">{inquiry.adminReply}</p>
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
