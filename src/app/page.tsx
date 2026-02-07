import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";

export default async function Home() {
  try {
    const session = await getServerSession(getAuthOptions(undefined));
    if (session?.user) {
      redirect("/api/auth/success");
    }
  } catch (e) {
    // NEXTAUTH_SECRET 누락 등 서버 예외 시 로그인 페이지로 (프로덕션 오류 방지)
    console.error("[Home] getServerSession error:", e);
  }
  redirect("/login");
}
