import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(getAuthOptions(undefined));
  if (session?.user) {
    redirect("/api/auth/success");
  }
  redirect("/login");
}
