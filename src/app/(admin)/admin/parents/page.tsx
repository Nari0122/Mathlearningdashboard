import { getParentsWithLinkedStudents } from "@/actions/parent-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, GraduationCap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ParentsManagementPage() {
    const parentsWithStudents = await getParentsWithLinkedStudents();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">학부모 관리</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    전체 학부모 목록과 각 학부모가 연동한 자녀(학생) 정보를 확인할 수 있습니다.
                </p>
            </div>

            {parentsWithStudents.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        등록된 학부모가 없습니다.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {parentsWithStudents.map((parent) => (
                        <Card key={parent.uid}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <UserCircle className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{parent.name || "(이름 없음)"}</CardTitle>
                                        <p className="text-xs text-muted-foreground font-mono">{parent.uid}</p>
                                        {parent.email && (
                                            <p className="text-xs text-muted-foreground">{parent.email}</p>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <GraduationCap className="h-4 w-4" />
                                    연동 자녀 (학생) {parent.linkedStudents.length}명
                                </div>
                                {parent.linkedStudents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">연동된 자녀가 없습니다.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {parent.linkedStudents.map((student) => (
                                            <li key={student.docId}>
                                                <Link
                                                    href={`/admin/students/${student.docId}`}
                                                    className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                                                >
                                                    {student.name}
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        (docId: {student.docId})
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
