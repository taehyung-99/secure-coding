import Link from "next/link";

const links = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/reports", label: "신고" },
  { href: "/admin/inquiries", label: "문의" },
  { href: "/admin/transactions", label: "거래" },
  { href: "/admin/actions", label: "조치 로그" },
];

export function AdminNav() {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-brand-text p-2 shadow-card">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
