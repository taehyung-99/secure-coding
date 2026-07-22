import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getCurrentUser } from "@/lib/session";
import { listAdminActions } from "@/services/admin.service";

export const dynamic = "force-dynamic";

export default async function AdminActionsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    redirect("/products");
  }

  const actions = await listAdminActions();

  return (
    <main className="page-shell max-w-6xl">
      <AdminNav />
      <p className="mt-6 text-sm font-semibold text-market-steel">Admin</p>
      <h1 className="mt-1 text-3xl font-bold text-market-ink">관리자 조치 로그</h1>
      <section className="mt-8 grid gap-3">
        {actions.map((action) => (
          <article key={action.id} className="surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-market-ink">{action.actionType}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {action.targetType} · {action.targetId}
                </p>
                {action.reason ? (
                  <p className="mt-2 text-sm text-slate-500">사유: {action.reason}</p>
                ) : null}
              </div>
              <span className="status-badge-green">
                @{action.admin.username}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
