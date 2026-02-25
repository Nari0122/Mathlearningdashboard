import { NextResponse } from "next/server";
import { studentService } from "@/services/studentService";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: docId } = await params;
        const student = await studentService.getStudentDetailByDocId(docId);

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        return NextResponse.json({
            name: student.name,
            grade: student.grade,
        });
    } catch (error) {
        console.error("API GET /api/students/[id] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
