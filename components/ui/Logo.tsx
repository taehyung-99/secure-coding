import Link from "next/link";
import { Check, PackageOpen, Shirt, Smartphone } from "lucide-react";

type LogoProps = {
  href?: string;
  showEnglishName?: boolean;
};

export function Logo({ href = "/", showEnglishName = false }: LogoProps) {
  const content = (
    <span className="inline-flex items-center gap-3">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand-primary/20 bg-brand-secondary text-brand-primary shadow-sm">
        <PackageOpen size={22} aria-hidden />
        <Shirt size={9} aria-hidden className="absolute left-2 top-2.5 text-brand-primary" />
        <Smartphone size={8} aria-hidden className="absolute bottom-2 right-2 text-brand-primary" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-brand-text ring-2 ring-white">
          <Check size={10} aria-hidden />
        </span>
      </span>
      <span className="grid gap-0.5">
        <span className="text-base font-bold text-brand-text">이것저것마켓</span>
        {showEnglishName ? (
          <span className="text-xs font-medium text-gray-500">This &amp; That Market</span>
        ) : null}
      </span>
    </span>
  );

  return (
    <Link href={href} className="inline-flex rounded-xl focus-visible:outline-brand-primary">
      {content}
    </Link>
  );
}
