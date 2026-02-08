import { redirect } from "next/navigation";

/** 예전 URL 호환: /parent/dashboard → /parent (그 다음 /parent/[uid]/dashboard로 리다이렉트) */
export default function ParentDashboardRedirect() {
    redirect("/parent");
}
