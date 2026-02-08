import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "학부모 대시보드 | MATHCLINIC",
    description: "자녀 연동 및 학습 현황 확인",
};

/** /parent 루트 레이아웃. 실제 사이드바·검증은 /parent/[uid]/layout에서 처리 */
export default function ParentLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
