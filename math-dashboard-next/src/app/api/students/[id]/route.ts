import { NextResponse } from "next/server";
import { studentService } from "@/services/studentService";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const isNumeric = /^\d+$/.test(id);
        const student = isNumeric
            ? await studentService.getStudentDetail(parseInt(id, 10))
            : await studentService.getStudentDetailByDocId(id);

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
