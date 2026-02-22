import { getStudentDetail, getStudentDetailByDocId } from "@/actions/student-actions";
import StudentDashboardClient from "@/components/features/student/StudentDashboardClient";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ParentChildPage({ params }: PageProps) {
    const { id } = await params;
    const student = /^\d+$/.test(id)
        ? await getStudentDetail(parseInt(id, 10))
        : await getStudentDetailByDocId(id);

    if (!student) {
        return notFound();
    }

    // Mock data for now as we reuse the structure
    // In a real scenario, we would fetch these stats properly
    // Reusing the same data structure as Student Dashboard
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="mb-6">
                <Link href="/parent" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm mb-4">
                    <ChevronLeft size={16} />
                    자녀 목록으로 돌아가기
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">{student.name} 학생의 학습 현황</h1>
                </div>
            </div>

            <StudentDashboardClient
                stats={null}
                recentAssignments={[]}
                recentRecords={[]}
                basePath="/parent/child"
            />
        </div>
    );
}
