import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginPageContent />;
}

async function LoginPageContent() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="page-shell flex min-h-[calc(100vh-88px)] max-w-md flex-col justify-center">
      <div className="text-center">
        <Logo showEnglishName />
        <h1 className="mt-8 text-3xl font-bold text-brand-text">로그인</h1>
        <p className="mt-2 text-sm text-gray-600">
          계정으로 접속해 거래와 채팅을 이어가세요.
        </p>
      </div>
      <div className="surface mt-8 p-6">
        <LoginForm />
      </div>
    </main>
  );
}
