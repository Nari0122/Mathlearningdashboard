import { studentService } from "@/services/studentService";
import { getHomeworks } from "@/actions/homework-actions";
import HomeworkClient from "@/components/features/homework/HomeworkClient";

export const dynamic = 'force-dynamic';

export default async function HomeworkPage() {
    // 1. Get logged in user from Firestore
    const studentUser = await studentService.getFirstStudent();

    if (!studentUser) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-red-600">학생 계정을 찾을 수 없습니다.</h1>
                <p className="text-gray-500 mt-2">데이터베이스에 'student' 권한을 가진 사용자가 있는지 확인해주세요.</p>
            </div>
        );
    }

    // 2. Fetch homeworks
    const homeworks = await getHomeworks(studentUser.id);

    return <HomeworkClient initialHomeworks={homeworks} studentId={studentUser.id} />;
}
