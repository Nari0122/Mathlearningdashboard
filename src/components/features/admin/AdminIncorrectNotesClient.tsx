"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, FileImage, X, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isMiddleSchool } from "@/lib/curriculum-data";
import { getBookTags } from "@/actions/learning-actions";

interface AdminIncorrectNotesClientProps {
    notes: any[];
    studentId: number;
}

export default function AdminIncorrectNotesClient({ notes, studentId }: AdminIncorrectNotesClientProps) {
    // Hierarchy Filter State
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterGrade, setFilterGrade] = useState<string>("all");
    const [filterSubject, setFilterSubject] = useState<string>("all");
    const [filterUnitName, setFilterUnitName] = useState<string>("all");
    const [filterDetail, setFilterDetail] = useState<string>("all");
    const [selectedZoomImg, setSelectedZoomImg] = useState<string | null>(null);

    // Extended Filter State (multi-select)
    const [filterErrorTypes, setFilterErrorTypes] = useState<string[]>([]);
    const [filterRetryCounts, setFilterRetryCounts] = useState<number[]>([]);
    const [filterBookTagIds, setFilterBookTagIds] = useState<string[]>([]);
    const [bookTags, setBookTags] = useState<{ id: string; name: string }[]>([]);

    // Load book tags
    useEffect(() => {
        async function loadBookTags() {
            const tags = await getBookTags(studentId);
            setBookTags(tags as { id: string; name: string }[]);
        }
        loadBookTags();
    }, [studentId]);

    // Reset filter logic
    useEffect(() => { setFilterGrade("all"); setFilterSubject("all"); setFilterUnitName("all"); setFilterDetail("all"); }, [filterLevel]);
    useEffect(() => { setFilterSubject("all"); setFilterUnitName("all"); setFilterDetail("all"); }, [filterGrade]);
    useEffect(() => { setFilterUnitName("all"); setFilterDetail("all"); }, [filterSubject]);
    useEffect(() => { setFilterDetail("all"); }, [filterUnitName]);

    // Filter Options - derived from actual notes data
    const filterLevels = useMemo(() => {
        const unique = new Set(notes.map((n: any) => n.schoolLevel).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes]);

    const filterGrades = useMemo(() => {
        let filtered = notes;
        if (filterLevel !== "all") {
            filtered = filtered.filter((n: any) => n.schoolLevel === filterLevel);
        }
        const unique = new Set(filtered.map((n: any) => n.grade).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes, filterLevel]);

    const filterSubjects = useMemo(() => {
        let filtered = notes;
        if (filterLevel !== "all") filtered = filtered.filter((n: any) => n.schoolLevel === filterLevel);
        if (filterGrade !== "all") filtered = filtered.filter((n: any) => n.grade === filterGrade);
        const unique = new Set(filtered.map((n: any) => n.subject).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes, filterLevel, filterGrade]);

    const filterUnitNames = useMemo(() => {
        let filtered = notes;
        if (filterLevel !== "all") filtered = filtered.filter((n: any) => n.schoolLevel === filterLevel);
        if (filterGrade !== "all") filtered = filtered.filter((n: any) => n.grade === filterGrade);
        if (filterSubject !== "all") filtered = filtered.filter((n: any) => n.subject === filterSubject);
        const unique = new Set(filtered.map((n: any) => n.unitName).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes, filterLevel, filterGrade, filterSubject]);

    const filterDetails = useMemo(() => {
        let filtered = notes;
        if (filterLevel !== "all") filtered = filtered.filter((n: any) => n.schoolLevel === filterLevel);
        if (filterGrade !== "all") filtered = filtered.filter((n: any) => n.grade === filterGrade);
        if (filterSubject !== "all") filtered = filtered.filter((n: any) => n.subject === filterSubject);
        if (filterUnitName !== "all") filtered = filtered.filter((n: any) => n.unitName === filterUnitName);
        const unique = new Set(filtered.map((n: any) => n.unitDetail).filter(Boolean));
        return Array.from(unique).sort();
    }, [notes, filterLevel, filterGrade, filterSubject, filterUnitName]);

    // Filtered notes - includes both hierarchy and extended filters
    const filteredNotes = useMemo(() => {
        return notes.filter((n: any) => {
            // Hierarchy filters
            const matchesLevel = filterLevel === "all" || n.schoolLevel === filterLevel;
            const matchesGrade = filterGrade === "all" || n.grade === filterGrade;
            const matchesSubject = filterSubject === "all" || n.subject === filterSubject;
            const matchesUnit = filterUnitName === "all" || n.unitName === filterUnitName;
            const matchesDetail = filterDetail === "all" || n.unitDetail === filterDetail;

            // Extended filters (multi-select = OR within category, AND across categories)
            const matchesErrorType = filterErrorTypes.length === 0 || filterErrorTypes.includes(n.errorType);
            const matchesRetryCount = filterRetryCounts.length === 0 || filterRetryCounts.includes(n.retryCount);
            const matchesBookTag = filterBookTagIds.length === 0 || filterBookTagIds.includes(n.bookTagId);

            return matchesLevel && matchesGrade && matchesSubject && matchesUnit && matchesDetail && matchesErrorType && matchesRetryCount && matchesBookTag;
        });
    }, [notes, filterLevel, filterGrade, filterSubject, filterUnitName, filterDetail, filterErrorTypes, filterRetryCounts, filterBookTagIds]);

    const resetFilters = () => {
        setFilterLevel("all");
        setFilterGrade("all");
        setFilterSubject("all");
        setFilterUnitName("all");
        setFilterDetail("all");
        setFilterErrorTypes([]);
        setFilterRetryCounts([]);
        setFilterBookTagIds([]);
    };

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
                <h2 className="text-xl font-bold tracking-tight">오답 노트 ({filteredNotes.length})</h2>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-lg border">
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={filterLevel} onValueChange={setFilterLevel}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="학제" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학제</SelectItem>
                            {filterLevels.map((level: string) => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterGrade} onValueChange={setFilterGrade}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="학년" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 학년</SelectItem>
                            {filterGrades.map((grade: any) => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="영역/과목" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 영역/과목</SelectItem>
                            {filterSubjects.map((s: any) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterUnitName} onValueChange={setFilterUnitName}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="단원" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 단원</SelectItem>
                            {filterUnitNames.map((u: any) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 세부내용 필터 - 고등만 표시 */}
                    {filterLevel !== "all" && !isMiddleSchool(filterLevel) && (
                        <Select value={filterDetail} onValueChange={setFilterDetail}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="세부내용" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체 세부내용</SelectItem>
                                {filterDetails.map((d: any) => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-200 mx-1" />

                    {/* Extended Filters - Error Type Multi-Select */}
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 mr-1">유형:</span>
                        {["C", "M", "R", "S"].map(type => (
                            <button
                                key={type}
                                onClick={() => {
                                    setFilterErrorTypes(prev =>
                                        prev.includes(type)
                                            ? prev.filter(t => t !== type)
                                            : [...prev, type]
                                    );
                                }}
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${filterErrorTypes.includes(type)
                                        ? errorColorMap[type] + " border-transparent"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* RetryCount Multi-Select */}
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 mr-1">회차:</span>
                        {[1, 2, 3, 4, 5].map(count => (
                            <button
                                key={count}
                                onClick={() => {
                                    setFilterRetryCounts(prev =>
                                        prev.includes(count)
                                            ? prev.filter(c => c !== count)
                                            : [...prev, count]
                                    );
                                }}
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${filterRetryCounts.includes(count)
                                        ? "bg-blue-100 text-blue-700 border-blue-200"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {count}회
                            </button>
                        ))}
                    </div>

                    {/* BookTag Multi-Select */}
                    {bookTags.length > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 mr-1">문제집:</span>
                            {bookTags.slice(0, 5).map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => {
                                        setFilterBookTagIds(prev =>
                                            prev.includes(tag.id)
                                                ? prev.filter(t => t !== tag.id)
                                                : [...prev, tag.id]
                                        );
                                    }}
                                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${filterBookTagIds.includes(tag.id)
                                            ? "bg-green-100 text-green-700 border-green-200"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Reset Button - show if any filter is active */}
                    {(filterLevel !== "all" || filterGrade !== "all" || filterSubject !== "all" || filterUnitName !== "all" || filterDetail !== "all" || filterErrorTypes.length > 0 || filterRetryCounts.length > 0 || filterBookTagIds.length > 0) && (
                        <Button variant="ghost" size="icon" onClick={resetFilters} title="필터 초기화">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {filteredNotes.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                    <p className="text-gray-500 font-medium">검색 결과가 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredNotes.map((note) => (
                        <Card key={note.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50/50 pb-0">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="bg-white">
                                                {note.unit
                                                    ? `[${note.unit.schoolLevel || ''}] ${note.unit.grade} ${note.unit.subject}`
                                                    : (note.schoolLevel ? `[${note.schoolLevel}] ${note.grade} ${note.subject}` : "단원 미지정")}
                                            </Badge>
                                            <Badge variant="outline" className="bg-white font-medium">
                                                {note.unitName || note.unit?.unitName || note.unit?.name || "단원 미지정"}
                                            </Badge>
                                            {note.unitDetail && (
                                                <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                                                    {note.unitDetail}
                                                </Badge>
                                            )}
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
                                            <div
                                                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group cursor-zoom-in"
                                                onClick={() => setSelectedZoomImg(note.questionImg)}
                                            >
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    <img
                                                        src={note.questionImg}
                                                        alt="문제 이미지"
                                                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-gray-900 border-none shadow-lg gap-2">
                                                            <Search className="w-4 h-4" />
                                                            확대보기
                                                        </Button>
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

            {/* Image Zoom Modal */}
            <Dialog open={!!selectedZoomImg} onOpenChange={(open) => !open && setSelectedZoomImg(null)}>
                <DialogContent className="max-w-[95vw] w-fit p-1 bg-black/90 border-none">
                    {selectedZoomImg && (
                        <div className="relative flex items-center justify-center min-h-[50vh]">
                            <img
                                src={selectedZoomImg}
                                alt="문제 확대 이미지"
                                className="max-h-[85vh] max-w-full object-contain"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -top-1 -right-1 text-white hover:bg-white/20 rounded-full"
                                onClick={() => setSelectedZoomImg(null)}
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
