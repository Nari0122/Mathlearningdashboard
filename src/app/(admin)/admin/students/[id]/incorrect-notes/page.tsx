import { getStudentIncorrectNotes } from "@/actions/student-actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertCircle, FileImage } from "lucide-react";

export default async function AdminIncorrectNotesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        notFound();
    }

    const notes = await getStudentIncorrectNotes(studentId);

    const errorTypeMap: Record<string, string> = {
        'C': '개념(C)',
        'M': '계산(M)',
        'R': '독해(R)',
        'S': '전략(S)'
    };

    const errorColorMap: Record<string, string> = {
        'C': 'bg-blue-100 text-blue-800',
        'M': 'bg-red-100 text-red-800',
        'R': 'bg-orange-100 text-orange-800',
        'S': 'bg-purple-100 text-purple-800'
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">오답 노트 ({notes.length})</h2>
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                    <p className="text-gray-500 font-medium">작성된 오답 노트가 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {notes.map((note) => (
                        <Card key={note.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50/50 pb-0">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-white">
                                                {note.unit?.name || "단원 미지정"}
                                            </Badge>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${errorColorMap[note.errorType] || 'bg-gray-100 text-gray-800'}`}>
                                                {errorTypeMap[note.errorType] || note.errorType}
                                            </span>
                                            {note.isResolved && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    해결됨
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-base font-bold text-gray-900 mt-0">
                                            {note.problemName || "문제 이름 없음"}
                                        </CardTitle>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700">문제 메모</h4>
                                        <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 min-h-[100px] text-sm text-gray-700 whitespace-pre-wrap">
                                            {note.memo || "메모가 없습니다."}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700">이미지 첨부</h4>
                                        {note.questionImg ? (
                                            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                                {/* In real app, render Next.js Image or img tag. Assuming URL is valid or placeholder */}
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    <img
                                                        src={note.questionImg}
                                                        alt="문제 이미지"
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="secondary" size="sm" className="pointer-events-none">확대보기</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-[120px] bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
                                                <FileImage className="h-8 w-8 mb-2 opacity-50" />
                                                <span className="text-xs">이미지 없음</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
