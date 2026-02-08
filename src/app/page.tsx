import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  // NEXTAUTH_SECRET 없으면 getServerSession이 500 발생 → 세션 검사 생략하고 로그인으로
  if (!process.env.NEXTAUTH_SECRET) {
    redirect("/login");
  }
  try {
    const session = await getServerSession(getAuthOptions(undefined));
    if (session?.user) {
      redirect("/api/auth/success");
    }
  } catch (e) {
    console.error("[Home] getServerSession error:", e);
  }
  redirect("/login");
}
