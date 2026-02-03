import { NextResponse } from "next/server";
import { studentService } from "@/services/studentService";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        console.log('[API Debug] id from params:', id);
        const studentId = parseInt(id);

        if (isNaN(studentId)) {
            console.error('[API Debug] Invalid student ID:', id);
            return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
        }

        const student = await studentService.getStudentDetail(studentId);
        console.log('[API Debug] Student found:', student ? student.name : 'null');

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        return NextResponse.json({
            name: student.name,
            grade: student.grade
        });
    } catch (error) {
        console.error("API GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
