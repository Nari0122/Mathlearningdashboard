import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ParentSidebar } from "@/components/shared/ParentSidebar";
import { MobileSidebarWrapper } from "@/components/shared/MobileSidebarWrapper";
import { getAuthOptions } from "@/lib/auth";
import { parentService } from "@/services/parentService";

export const metadata: Metadata = {
    title: "학부모 대시보드 | MATHCLINIC",
    description: "자녀 연동 및 학습 현황 확인",
};

export default async function ParentUidLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ uid: string }>;
}>) {
    const session = await getServerSession(getAuthOptions(undefined));
    const sessionUid = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id;
    const { uid } = await params;

    if (!session || !sessionUid) redirect("/login");
    if (sessionUid !== uid) redirect("/login");

    const parent = await parentService.getParentByUid(uid);
    if (!parent) redirect("/login");

    const parentName = (parent.name as string)?.trim() || undefined;

    return (
        <div className="flex h-screen bg-gray-50">
            <div className="hidden md:block h-full">
                <ParentSidebar userName={parentName} parentUid={uid} />
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
                    <span className="font-bold text-lg">MATHCLINIC 학부모</span>
                    <MobileSidebarWrapper>
                        <ParentSidebar userName={parentName} parentUid={uid} className="w-full border-none shadow-none" />
                    </MobileSidebarWrapper>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <main className="p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
