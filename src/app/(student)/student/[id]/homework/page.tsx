import { notFound } from "next/navigation";
import { learningService } from "@/services/learningService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StudentHomeworkPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    const assignments = await learningService.getAssignments(studentId);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">숙제 관리</h1>
            <div className="grid grid-cols-1 gap-4">
                {assignments.map((assignment: any) => (
                    <Card key={assignment.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                                {assignment.isCompleted ? (
                                    <Badge className="bg-green-100 text-green-800">완료</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-500">미완료</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 space-y-1">
                                <p>기한: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                                {assignment.assignedDate && <p>부여일: {new Date(assignment.assignedDate).toLocaleDateString()}</p>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {assignments.length === 0 && (
                    <p className="text-gray-500">등록된 숙제가 없습니다.</p>
                )}
            </div>
        </div>
    );
}
