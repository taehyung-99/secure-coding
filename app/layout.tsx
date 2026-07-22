import type { Metadata } from "next";
import { AppNav } from "@/components/layout/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "이것저것마켓",
  description: "이것저것을 쉽고 안전하게 거래하는 중고거래 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
