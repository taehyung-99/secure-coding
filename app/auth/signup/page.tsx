import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { Logo } from "@/components/ui/Logo";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/products");
  }

  return (
    <main className="page-shell flex min-h-[calc(100vh-88px)] max-w-md flex-col justify-center">
      <div className="text-center">
        <Logo showEnglishName />
        <h1 className="mt-8 text-3xl font-bold text-brand-text">회원가입</h1>
        <p className="mt-2 text-sm text-gray-600">
          프로필을 만들고 전국의 다양한 거래를 시작하세요.
        </p>
      </div>
      <div className="surface mt-8 p-6">
        <SignupForm />
      </div>
    </main>
  );
}
