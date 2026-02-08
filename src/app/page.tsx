import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions, getNextAuthSecret } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  // NEXTAUTH_SECRET 없으면 getServerSession이 500 발생 → 세션 검사 생략하고 로그인으로
  if (!getNextAuthSecret()) {
    redirect("/login");
  }
  try {
    const session = await getServerSession(getAuthOptions(undefined));
    if (session?.user) {
      redirect("/api/auth/success");
    }
  } catch (e) {
    // Next.js redirect()는 NEXT_REDIRECT를 throw함 → 그대로 재전파
    if (e && typeof e === "object" && "digest" in e && String((e as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("[Home] getServerSession error:", e);
  }
  redirect("/login");
}
