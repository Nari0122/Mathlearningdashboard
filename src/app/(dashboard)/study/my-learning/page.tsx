import { getUnits } from "@/actions/unit-actions";
import MyLearningClient from "@/components/features/learning/MyLearningClient";
import { studentService } from "@/services/studentService";

// Force dynamic since we read DB
export const dynamic = 'force-dynamic';

export default async function MyLearningPage() {
    // 1. Get logged in user from Firestore
    const studentUser = await studentService.getFirstStudent();
    if (!studentUser) return <div>Student not found.</div>;

    // 2. Fetch units
    const units = await getUnits(studentUser.id);

    return <MyLearningClient initialUnits={units} studentId={studentUser.id} />;
}
