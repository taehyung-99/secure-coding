import Link from "next/link";
import { redirect } from "next/navigation";
import { UnblockButton } from "@/components/safety/UnblockButton";
import { getCurrentUser } from "@/lib/session";
import { listMyBlocks } from "@/services/block.service";

export const dynamic = "force-dynamic";

export default async function MyBlocksPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const blocks = await listMyBlocks(user.id);

  return (
    <main className="page-shell max-w-3xl">
      <Link href="/products" className="eyebrow-link">
        상품 목록으로
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-market-ink">차단 목록</h1>
      <p className="mt-2 text-sm text-slate-600">
        차단한 사용자의 상품과 메시지는 제한됩니다.
      </p>

      <section className="mt-8 grid gap-3">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="surface flex items-center justify-between gap-4 p-4"
          >
            <div>
              <p className="font-semibold text-market-ink">
                {block.blocked.profile?.nickname ?? block.blocked.username}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                @{block.blocked.username}
              </p>
            </div>
            <UnblockButton userId={block.blocked.id} />
          </div>
        ))}
      </section>

      {blocks.length === 0 ? (
        <div className="surface mt-8 p-8 text-center text-sm text-slate-600">
          차단한 사용자가 없습니다.
        </div>
      ) : null}
    </main>
  );
}
