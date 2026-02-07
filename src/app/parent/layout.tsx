import type { Metadata } from "next";
import { ParentSidebar } from "@/components/shared/ParentSidebar";
import { MobileSidebarWrapper } from "@/components/shared/MobileSidebarWrapper";

export const metadata: Metadata = {
    title: "학부모 대시보드 | MATHCLINIC",
    description: "자녀 연동 및 학습 현황 확인",
};

export default function ParentLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen bg-gray-50">
            <div className="hidden md:block h-full">
                <ParentSidebar />
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
                    <span className="font-bold text-lg">MATHCLINIC 학부모</span>
                    <MobileSidebarWrapper>
                        <ParentSidebar className="w-full border-none shadow-none" />
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
