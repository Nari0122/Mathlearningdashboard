"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, FileImage, X, Search, FileText, Pencil, Plus, Loader2, Trash2, BookMarked } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SCHOOL_LEVELS, GRADES, SUBJECTS, getUnits, getDetails, isMiddleSchool } from "@/lib/curriculum-data";
import { getBookTags, createBookTag, updateIncorrectNote, createIncorrectNote, deleteIncorrectNote } from "@/actions/learning-actions";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";

interface Attachment {
    id: string;
    originalName: string;
    storagePath: string;
    downloadUrl: string;
    type: "image" | "file";
    sizeBytes: number;
    contentType: string;
    compressed?: boolean;
}

interface AdminIncorrectNotesClientProps {
    notes: any[];
    units?: { id: number; name?: string; unitName?: string; schoolLevel?: string; grade?: string; subject?: string }[];
    studentDocId: string;
}

export default function AdminIncorrectNotesClient({ notes, units = [], studentDocId }: AdminIncorrectNotesClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
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

    // Admin edit note (full form same as create)
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editSelLevel, setEditSelLevel] = useState<string>("");
    const [editSelGrade, setEditSelGrade] = useState<string>("");
    const [editSelSubject, setEditSelSubject] = useState<string>("");
    const [editSelUnitName, setEditSelUnitName] = useState<string>("");
    const [editSelDetail, setEditSelDetail] = useState<string>("");
    const [editBookName, setEditBookName] = useState("");
    const [editPage, setEditPage] = useState("");
    const [editNumber, setEditNumber] = useState("");
    const [editBookTagInput, setEditBookTagInput] = useState("");
    const [editSelectedBookTagId, setEditSelectedBookTagId] = useState<string | null>(null);
    const [editShowBookTagSuggestions, setEditShowBookTagSuggestions] = useState(false);
    const [editMemo, setEditMemo] = useState("");
    const [editErrorType, setEditErrorType] = useState("C");
    const [editRetryCount, setEditRetryCount] = useState<number>(1);
    const [editIsResolved, setEditIsResolved] = useState(false);
    const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);
    const [editIsUploading, setEditIsUploading] = useState(false);
    const [editUploadProgress, setEditUploadProgress] = useState<Record<string, number>>({});

    // Admin create note (student form parity: 5-level + problem info + book tag)
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newSelLevel, setNewSelLevel] = useState<string>("");
    const [newSelGrade, setNewSelGrade] = useState<string>("");
    const [newSelSubject, setNewSelSubject] = useState<string>("");
    const [newSelUnitName, setNewSelUnitName] = useState<string>("");
    const [newSelDetail, setNewSelDetail] = useState<string>("");
    const [newBookName, setNewBookName] = useState("");
    const [newPage, setNewPage] = useState("");
    const [newNumber, setNewNumber] = useState("");
    const [newBookTagInput, setNewBookTagInput] = useState("");
    const [newSelectedBookTagId, setNewSelectedBookTagId] = useState<string | null>(null);
    const [newShowBookTagSuggestions, setNewShowBookTagSuggestions] = useState(false);
    const [newMemo, setNewMemo] = useState("");
    const [newErrorType, setNewErrorType] = useState("C");
    const [newRetryCount, setNewRetryCount] = useState<number>(1);
    const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
    const [newIsUploading, setNewIsUploading] = useState(false);
    const [newUploadProgress, setNewUploadProgress] = useState<Record<string, number>>({});

    // Load book tags
    useEffect(() => {
        async function loadBookTags() {
            const tags = await getBookTags(studentDocId);
            setBookTags(tags as { id: string; name: string }[]);
        }
        loadBookTags();
    }, [studentDocId]);

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

    // Create form options (curriculum-data, same as student)
    const newLevels = SCHOOL_LEVELS;
    const newGrades = (newSelLevel && GRADES[newSelLevel as keyof typeof GRADES]) ? GRADES[newSelLevel as keyof typeof GRADES] : [];
    const newSubjects = (newSelLevel && newSelGrade && SUBJECTS[newSelLevel as keyof typeof SUBJECTS]?.[newSelGrade]) ? SUBJECTS[newSelLevel as keyof typeof SUBJECTS][newSelGrade] : [];
    const newUnitList = newSelSubject ? getUnits(newSelSubject, newSelGrade) : [];
    const newDetails = (newSelSubject && newSelGrade && newSelUnitName) ? getDetails(newSelSubject, newSelGrade, newSelUnitName) : [];

    // Edit form options (curriculum-data)
    const editGrades = (editSelLevel && GRADES[editSelLevel as keyof typeof GRADES]) ? GRADES[editSelLevel as keyof typeof GRADES] : [];
    const editSubjects = (editSelLevel && editSelGrade && SUBJECTS[editSelLevel as keyof typeof SUBJECTS]?.[editSelGrade]) ? SUBJECTS[editSelLevel as keyof typeof SUBJECTS][editSelGrade] : [];
    const editUnitList = editSelSubject ? getUnits(editSelSubject, editSelGrade) : [];
    const editDetails = (editSelSubject && editSelGrade && editSelUnitName) ? getDetails(editSelSubject, editSelGrade, editSelUnitName) : [];

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

    const openEditNote = (note: any) => {
        setEditingNoteId(note.id);
        setEditSelLevel(note.schoolLevel || note.unit?.schoolLevel || "");
        setEditSelGrade(note.grade || note.unit?.grade || "");
        setEditSelSubject(note.subject || note.unit?.subject || "");
        setEditSelUnitName(note.unitName || note.unit?.unitName || note.unit?.name || "");
        setEditSelDetail(note.unitDetail || "");
        const problemName = note.problemName || "";
        const match = problemName.match(/(.*)\s+(\d+)p\s*(\d+)번/);
        if (match) {
            setEditBookName(match[1].trim());
            setEditPage(match[2]);
            setEditNumber(match[3]);
        } else {
            setEditBookName(problemName);
            setEditPage("");
            setEditNumber("");
        }
        setEditMemo(note.memo || "");
        setEditErrorType(note.errorType || "C");
        setEditRetryCount(note.retryCount ?? 1);
        setEditIsResolved(!!note.isResolved);
        setEditAttachments(note.attachments || []);
        setEditUploadProgress({});
        if (note.bookTagId) {
            setEditSelectedBookTagId(note.bookTagId);
            const tag = bookTags.find((t) => t.id === note.bookTagId);
            setEditBookTagInput(tag?.name || "");
        } else {
            setEditSelectedBookTagId(null);
            setEditBookTagInput("");
        }
    };

    const closeEditNote = () => {
        setEditingNoteId(null);
    };

    const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const storageInstance = storage;
        if (!storageInstance) {
            alert("파일 업로드를 사용하려면 Firebase Storage가 설정되어 있어야 합니다.");
            return;
        }
        setEditIsUploading(true);
        const wrongNoteId = editingNoteId || "temp_" + Date.now();
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileId = uuidv4();
            const isImage = file.type.startsWith("image/");
            try {
                let uploadFile: File = file;
                let compressed = false;
                if (isImage) {
                    try {
                        uploadFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.7 });
                        compressed = true;
                    } catch (err) {
                        console.error("Compression failed", err);
                    }
                }
                const storagePath = `students/${studentDocId}/wrongNotes/${wrongNoteId}/attachments/${fileId}_${file.name}`;
                const storageRef = ref(storageInstance, storagePath);
                const uploadTask = uploadBytesResumable(storageRef, uploadFile);
                await new Promise<void>((resolve, reject) => {
                    uploadTask.on("state_changed", (snapshot) => {
                        setEditUploadProgress((prev) => ({ ...prev, [fileId]: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 }));
                    }, reject, () => resolve());
                });
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                setEditAttachments((prev) => [...prev, { id: fileId, originalName: file.name, storagePath, downloadUrl, type: isImage ? "image" : "file", sizeBytes: uploadFile.size, contentType: uploadFile.type, compressed }]);
            } catch (error) {
                console.error(`Upload failed ${file.name}`, error);
                alert(`${file.name} 업로드 실패`);
            }
        }
        setEditIsUploading(false);
        e.target.value = "";
    };

    const removeEditAttachment = (id: string) => {
        if (!confirm("첨부파일을 목록에서 삭제하시겠습니까?")) return;
        setEditAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    const handleSaveNoteEdit = () => {
        if (!editingNoteId) return;
        const isMiddle = editSelLevel && isMiddleSchool(editSelLevel);
        if (!editSelLevel || !editSelGrade || !editSelSubject || !editSelUnitName || !editBookName.trim()) {
            alert("학제, 학년, 과목, 단원, 교재명을 모두 입력해 주세요.");
            return;
        }
        if (!isMiddle && editDetails.length > 0 && !editSelDetail) {
            alert("세부내용을 선택해 주세요.");
            return;
        }
        if (!editPage?.trim()) {
            alert("페이지를 입력해 주세요.");
            return;
        }
        if (!editNumber?.trim()) {
            alert("문제 번호를 입력해 주세요.");
            return;
        }
        if (!editMemo?.trim()) {
            alert("메모/풀이를 입력해 주세요.");
            return;
        }
        const problemName = `${editBookName.trim()} ${editPage ? `${editPage}p ` : ""}${editNumber ? `${editNumber}번` : ""}`.trim();
        startTransition(async () => {
            const result = await updateIncorrectNote(studentDocId, editingNoteId, {
                schoolLevel: editSelLevel,
                grade: editSelGrade,
                subject: editSelSubject,
                unitName: editSelUnitName,
                unitDetail: isMiddle ? "" : (editSelDetail || ""),
                problemName,
                memo: editMemo.trim(),
                errorType: editErrorType,
                retryCount: editRetryCount,
                isResolved: editIsResolved,
                bookTagId: editSelectedBookTagId || undefined,
                attachments: editAttachments,
            });
            if (result.success) {
                closeEditNote();
                router.refresh();
            } else {
                alert(result.message ?? "수정에 실패했습니다.");
            }
        });
    };

    const handleDeleteNote = () => {
        if (!editingNoteId) return;
        if (!confirm("정말 이 오답 노트를 삭제하시겠습니까?")) return;
        startTransition(async () => {
            const result = await deleteIncorrectNote(studentDocId, editingNoteId);
            if (result.success) {
                closeEditNote();
                router.refresh();
            } else {
                alert(result.message ?? "삭제에 실패했습니다.");
            }
        });
    };

    const openCreateNote = () => {
        setNewSelLevel("");
        setNewSelGrade("");
        setNewSelSubject("");
        setNewSelUnitName("");
        setNewSelDetail("");
        setNewBookName("");
        setNewPage("");
        setNewNumber("");
        setNewBookTagInput("");
        setNewSelectedBookTagId(null);
        setNewMemo("");
        setNewErrorType("C");
        setNewRetryCount(1);
        setNewAttachments([]);
        setNewUploadProgress({});
        setIsCreateOpen(true);
    };

    const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const storageInstance = storage;
        if (!storageInstance) {
            alert("파일 업로드를 사용하려면 Firebase Storage가 설정되어 있어야 합니다. Vercel 환경 변수에 NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET(또는 NEXT_PUBLIC_FIREBASE_PROJECT_ID)를 설정해 주세요.");
            return;
        }
        setNewIsUploading(true);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileId = uuidv4();
            const wrongNoteId = "temp_" + Date.now();
            const isImage = file.type.startsWith("image/");
            try {
                let uploadFile: File = file;
                let compressed = false;
                if (isImage) {
                    try {
                        uploadFile = await imageCompression(file, {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                            initialQuality: 0.7,
                        });
                        compressed = true;
                    } catch (err) {
                        console.error("Compression failed, using original", err);
                    }
                }
                const storagePath = `students/${studentDocId}/wrongNotes/${wrongNoteId}/attachments/${fileId}_${file.name}`;
                const storageRef = ref(storageInstance, storagePath);
                const uploadTask = uploadBytesResumable(storageRef, uploadFile);
                await new Promise<void>((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setNewUploadProgress((prev) => ({ ...prev, [fileId]: progress }));
                        },
                        (err) => reject(err),
                        () => resolve()
                    );
                });
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                const attachment: Attachment = {
                    id: fileId,
                    originalName: file.name,
                    storagePath,
                    downloadUrl,
                    type: isImage ? "image" : "file",
                    sizeBytes: uploadFile.size,
                    contentType: uploadFile.type,
                    compressed,
                };
                setNewAttachments((prev) => [...prev, attachment]);
            } catch (error) {
                console.error(`Failed to upload ${file.name}`, error);
                alert(`${file.name} 업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
            }
        }
        setNewIsUploading(false);
        e.target.value = "";
    };

    const removeNewAttachment = (id: string) => {
        if (!confirm("첨부파일을 목록에서 삭제하시겠습니까? (저장 시 반영됨)")) return;
        setNewAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    const handleCreateNote = () => {
        const isMiddle = newSelLevel && isMiddleSchool(newSelLevel);
        if (!newSelLevel || !newSelGrade || !newSelSubject || !newSelUnitName || !newBookName.trim()) {
            alert("학제, 학년, 과목, 단원, 교재명을 모두 입력해 주세요.");
            return;
        }
        if (!isMiddle && newDetails.length > 0 && !newSelDetail) {
            alert("세부내용을 선택해 주세요.");
            return;
        }
        if (!newPage?.trim()) {
            alert("페이지를 입력해 주세요.");
            return;
        }
        if (!newNumber?.trim()) {
            alert("문제 번호를 입력해 주세요.");
            return;
        }
        if (!newMemo?.trim()) {
            alert("메모/풀이를 입력해 주세요.");
            return;
        }
        const problemName = `${newBookName.trim()} ${newPage ? `${newPage}p ` : ""}${newNumber ? `${newNumber}번` : ""}`.trim();
        const matchingUnit = units.find(
            (u) =>
                u.schoolLevel === newSelLevel &&
                u.grade === newSelGrade &&
                u.subject === newSelSubject &&
                (u.unitName || u.name) === newSelUnitName
        );
        const unitIdToUse = matchingUnit ? matchingUnit.id : 0;

        startTransition(async () => {
            const result = await createIncorrectNote(studentDocId, {
                unitId: unitIdToUse,
                problemName,
                memo: newMemo.trim(),
                errorType: newErrorType,
                retryCount: newRetryCount,
                schoolLevel: newSelLevel,
                grade: newSelGrade,
                subject: newSelSubject,
                unitName: newSelUnitName,
                unitDetail: isMiddle ? "" : (newSelDetail || ""),
                bookTagId: newSelectedBookTagId || undefined,
                attachments: newAttachments,
            });
            if (result.success) {
                setIsCreateOpen(false);
                router.refresh();
            } else {
                alert(result.message ?? "추가에 실패했습니다.");
            }
        });
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
            {/* 학생 페이지와 동일: 아이콘 + 제목/설명 + 오답노트 작성 버튼 */}
            <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                        <BookMarked className="w-6 h-6 text-[#5D00E2]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#2F3438]">오답 노트 ({filteredNotes.length})</h2>
                        <p className="text-sm text-[#6C727A] mt-0.5">틀린 문제를 정리하고 유형별로 복습하세요.</p>
                    </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 shrink-0 min-h-[44px] px-5" onClick={openCreateNote}>
                    <Plus className="mr-2 h-4 w-4" />
                    오답노트 작성
                </Button>
            </div>

            {/* Filter Section - 학생과 동일 */}
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
                                            <Badge variant="outline" className="bg-white shrink-0">
                                                {note.unit
                                                    ? `[${note.unit.schoolLevel || ''}] ${note.unit.grade} ${note.unit.subject}`
                                                    : (note.schoolLevel ? `[${note.schoolLevel}] ${note.grade} ${note.subject}` : "단원 미지정")}
                                            </Badge>
                                            <Badge variant="outline" className="bg-white font-medium shrink-0">
                                                {note.unitName || note.unit?.unitName || note.unit?.name || "단원 미지정"}
                                            </Badge>
                                            {note.unitDetail ? (
                                                <Badge variant="secondary" className="bg-gray-200 text-gray-700 shrink-0">
                                                    {note.unitDetail}
                                                </Badge>
                                            ) : null}
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${errorColorMap[note.errorType] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                {errorTypeMap[note.errorType] || note.errorType}
                                            </span>
                                            {(note.retryCount != null && note.retryCount >= 1) ? (
                                                <Badge variant="outline" className="bg-white font-medium text-gray-700 shrink-0">
                                                    {note.retryCount}회차
                                                </Badge>
                                            ) : null}
                                            {note.bookTagId ? (() => {
                                                const tag = bookTags.find((t) => t.id === note.bookTagId);
                                                return tag ? (
                                                    <Badge variant="outline" className="bg-white text-gray-700 shrink-0">
                                                        {tag.name}
                                                    </Badge>
                                                ) : null;
                                            })() : null}
                                            {note.isResolved ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 shrink-0">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    해결됨
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <CardTitle className="text-base font-bold text-gray-900 mt-2">
                                            {note.problemName || "문제 이름 없음"}
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-start gap-2 ml-2">
                                        <div className="text-xs text-gray-400 whitespace-nowrap mt-2">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => openEditNote(note)}
                                            disabled={isPending}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => { if (confirm("정말 이 오답 노트를 삭제하시겠습니까?")) { startTransition(async () => { const r = await deleteIncorrectNote(studentDocId, note.id); if (r.success) router.refresh(); }); } }}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-2 gap-3 md:gap-6">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700">문제 메모</h4>
                                        <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 min-h-[100px] text-sm text-gray-700 whitespace-pre-wrap">
                                            {note.memo || "메모가 없습니다."}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700">첨부 파일</h4>
                                        {note.attachments && note.attachments.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                {note.attachments.map((att: any) => (
                                                    att.type === 'image' ? (
                                                        <div
                                                            key={att.id}
                                                            className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group cursor-zoom-in"
                                                            onClick={() => setSelectedZoomImg(att.downloadUrl)}
                                                        >
                                                            <img
                                                                src={att.downloadUrl}
                                                                alt={att.originalName}
                                                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1 truncate px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {att.originalName}
                                                            </div>
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Search className="w-5 h-5 text-white" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <a
                                                            key={att.id}
                                                            href={att.downloadUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex flex-col items-center justify-center aspect-video bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors p-2 text-center"
                                                        >
                                                            <FileText className="h-8 w-8 text-blue-500 mb-1" />
                                                            <span className="text-xs text-gray-600 truncate w-full px-2">{att.originalName}</span>
                                                        </a>
                                                    )
                                                ))}
                                            </div>
                                        ) : note.questionImg ? (
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

            {/* 새 오답 노트 Dialog - 학생 페이지와 동일한 폼 */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>오답노트 작성</DialogTitle>
                        <DialogDescription>학생 대신 오답 노트를 등록합니다. 학제·학년·과목·단원·문제 정보·문제집 태그를 입력하세요.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* 5-Level Selection Grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">학제</Label>
                                <Select value={newSelLevel} onValueChange={(v) => { setNewSelLevel(v); setNewSelGrade(""); setNewSelSubject(""); setNewSelUnitName(""); setNewSelDetail(""); }}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="학제 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {newLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">학년</Label>
                                <Select value={newSelGrade} onValueChange={(v) => { setNewSelGrade(v); setNewSelSubject(""); setNewSelUnitName(""); setNewSelDetail(""); }} disabled={!newSelLevel}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="학년 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {newGrades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">과목/영역</Label>
                                <Select value={newSelSubject} onValueChange={(v) => { setNewSelSubject(v); setNewSelUnitName(""); setNewSelDetail(""); }} disabled={!newSelGrade}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="과목 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {newSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">단원</Label>
                                <Select value={newSelUnitName} onValueChange={(v) => { setNewSelUnitName(v); setNewSelDetail(""); }} disabled={!newSelSubject}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="단원 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {newUnitList.map((u) => (
                                            <SelectItem key={u.unit} value={u.unit}>{u.unit}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {newSelLevel && !isMiddleSchool(newSelLevel) && (
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">세부내용</Label>
                                    <Select value={newSelDetail} onValueChange={setNewSelDetail} disabled={!newSelUnitName || newDetails.length === 0}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder={newDetails.length > 0 ? "세부내용 선택" : "세부내용 없음"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {newDetails.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* 순서: 문제정보 → 문제태그 → 오답유형 → 틀린횟수 → 메모 → 사진첨부 (모바일 터치 영역 확보) */}
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label className="font-semibold">문제 정보</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="col-span-2">
                                        <Input placeholder="교재명 (예: 쎈)" value={newBookName} onChange={(e) => setNewBookName(e.target.value)} />
                                    </div>
                                    <div className="relative">
                                        <Input placeholder="페이지" value={newPage} onChange={(e) => setNewPage(e.target.value)} className="pr-6" />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">p</span>
                                    </div>
                                    <div className="relative">
                                        <Input placeholder="번호" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} className="pr-6" />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">번</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="font-semibold">문제집 태그 (선택)</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="태그 입력 (예: 쎈, 블랙라벨)"
                                        value={newBookTagInput}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\s/g, "");
                                            setNewBookTagInput(val);
                                            setNewSelectedBookTagId(null);
                                            setNewShowBookTagSuggestions(val.length > 0);
                                        }}
                                        onFocus={() => setNewShowBookTagSuggestions(newBookTagInput.length > 0 || bookTags.length > 0)}
                                        onBlur={() => setTimeout(() => setNewShowBookTagSuggestions(false), 150)}
                                    />
                                    {newShowBookTagSuggestions && (
                                        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {bookTags.filter((t) => t.name.toLowerCase().includes(newBookTagInput.toLowerCase())).slice(0, 5).map((tag) => (
                                                <div key={tag.id} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm min-h-[44px] flex items-center" onMouseDown={() => { setNewBookTagInput(tag.name); setNewSelectedBookTagId(tag.id); setNewShowBookTagSuggestions(false); }}>{tag.name}</div>
                                            ))}
                                            {newBookTagInput.length > 0 && !bookTags.some((t) => t.name.toLowerCase() === newBookTagInput.toLowerCase()) && (
                                                <div className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm text-green-700 border-t min-h-[44px] flex items-center" onMouseDown={async () => {
                                                    const result = await createBookTag(studentDocId, newBookTagInput);
                                                    if (result.success && result.tagId) { setNewSelectedBookTagId(result.tagId); const newTags = await getBookTags(studentDocId); setBookTags(newTags as { id: string; name: string }[]); }
                                                    setNewShowBookTagSuggestions(false);
                                                }}>+ 새 태그: <strong>{newBookTagInput}</strong></div>
                                            )}
                                        </div>
                                    )}
                                    {newSelectedBookTagId && <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-700">저장됨</Badge>}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="font-semibold">오답 유형</Label>
                                <Select value={newErrorType} onValueChange={setNewErrorType}>
                                    <SelectTrigger className="w-full min-h-[44px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="C">개념(C)</SelectItem>
                                        <SelectItem value="M">계산(M)</SelectItem>
                                        <SelectItem value="R">독해(R)</SelectItem>
                                        <SelectItem value="S">전략(S)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label className="font-semibold">틀린 횟수</Label>
                                <Select value={String(newRetryCount)} onValueChange={(v) => setNewRetryCount(Number(v))}>
                                    <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder="틀린 횟수 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}회</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label className="font-semibold">메모 / 풀이</Label>
                                <Textarea placeholder="틀린 이유나 올바른 풀이 과정을 기록하세요." className="h-32 resize-none min-h-[44px]" value={newMemo} onChange={(e) => setNewMemo(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold">사진 첨부 (이미지/문서)</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer min-h-[120px]" onClick={() => document.getElementById("admin-file-upload")?.click()}>
                                    <div className="bg-blue-50 text-blue-600 p-3 rounded-full mb-3">
                                        {newIsUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">클릭하여 파일 업로드</p>
                                    <p className="text-xs text-gray-400 mt-1">이미지는 자동 압축됩니다.</p>
                                    <Input id="admin-file-upload" type="file" className="hidden" multiple accept="image/*,.pdf,.hwp,.docx" onChange={handleNewFileUpload} disabled={newIsUploading} />
                                </div>
                                {newAttachments.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 mt-4">
                                        {newAttachments.map((file) => (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {file.type === "image" ? (
                                                        <div className="h-10 w-10 relative rounded overflow-hidden flex-shrink-0 bg-gray-100 border">
                                                            <img src={file.downloadUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded text-gray-500 flex-shrink-0">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-700 truncate">{file.originalName}</p>
                                                        <p className="text-xs text-gray-400">{(file.sizeBytes / 1024).toFixed(1)} KB {file.compressed && <span className="text-green-600 font-bold">(압축됨)</span>}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); removeNewAttachment(file.id); }}><X className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {Object.entries(newUploadProgress).map(([key, value]) => value < 100 ? (
                                    <div key={key} className="space-y-1">
                                        <div className="flex justify-between text-xs text-gray-500"><span>업로드 중...</span><span>{Math.round(value)}%</span></div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${value}%` }} /></div>
                                    </div>
                                ) : null)}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="w-24">취소</Button>
                        <Button onClick={handleCreateNote} disabled={isPending} className="w-32 bg-blue-600 hover:bg-blue-700">
                            {isPending ? "등록 중..." : "오답노트 등록"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Admin Edit Note Dialog - 작성 폼과 동일한 전체 폼 (5단계 단원, 문제 정보, 문제집 태그, 파일 첨부, 삭제) */}
            <Dialog open={!!editingNoteId} onOpenChange={(open) => !open && closeEditNote()}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>오답노트 수정</DialogTitle>
                        <DialogDescription>학생 페이지와 동일하게 단원·문제 정보·문제집 태그·첨부 파일을 수정할 수 있습니다.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* 5-Level Selection */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">학제</Label>
                                <Select value={editSelLevel} onValueChange={(v) => { setEditSelLevel(v); setEditSelGrade(""); setEditSelSubject(""); setEditSelUnitName(""); setEditSelDetail(""); }}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="학제 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {SCHOOL_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">학년</Label>
                                <Select value={editSelGrade} onValueChange={(v) => { setEditSelGrade(v); setEditSelSubject(""); setEditSelUnitName(""); setEditSelDetail(""); }} disabled={!editSelLevel}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="학년 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {editGrades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">과목/영역</Label>
                                <Select value={editSelSubject} onValueChange={(v) => { setEditSelSubject(v); setEditSelUnitName(""); setEditSelDetail(""); }} disabled={!editSelGrade}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="과목 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {editSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">단원</Label>
                                <Select value={editSelUnitName} onValueChange={(v) => { setEditSelUnitName(v); setEditSelDetail(""); }} disabled={!editSelSubject}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="단원 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {editUnitList.map((u) => <SelectItem key={u.unit} value={u.unit}>{u.unit}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {editSelLevel && !isMiddleSchool(editSelLevel) && (
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">세부내용</Label>
                                    <Select value={editSelDetail} onValueChange={setEditSelDetail} disabled={!editSelUnitName || editDetails.length === 0}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder={editDetails.length > 0 ? "세부내용 선택" : "세부내용 없음"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {editDetails.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* 순서: 문제정보 → 문제태그 → 오답유형 → 틀린횟수 → 메모 → 사진첨부 (모바일 터치 영역 확보) */}
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label className="font-semibold">문제 정보</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="col-span-2">
                                            <Input placeholder="교재명" value={editBookName} onChange={(e) => setEditBookName(e.target.value)} />
                                        </div>
                                        <div className="relative">
                                            <Input placeholder="페이지" value={editPage} onChange={(e) => setEditPage(e.target.value)} className="pr-6" />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">p</span>
                                        </div>
                                        <div className="relative">
                                            <Input placeholder="번호" value={editNumber} onChange={(e) => setEditNumber(e.target.value)} className="pr-6" />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">번</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-semibold">문제집 태그 (선택)</Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="태그 입력"
                                            value={editBookTagInput}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\s/g, "");
                                                setEditBookTagInput(val);
                                                setEditSelectedBookTagId(null);
                                                setEditShowBookTagSuggestions(val.length > 0);
                                            }}
                                            onFocus={() => setEditShowBookTagSuggestions(editBookTagInput.length > 0 || bookTags.length > 0)}
                                            onBlur={() => setTimeout(() => setEditShowBookTagSuggestions(false), 150)}
                                        />
                                        {editShowBookTagSuggestions && (
                                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                {bookTags.filter((t) => t.name.toLowerCase().includes(editBookTagInput.toLowerCase())).slice(0, 5).map((tag) => (
                                                    <div key={tag.id} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm min-h-[44px] flex items-center" onMouseDown={() => { setEditBookTagInput(tag.name); setEditSelectedBookTagId(tag.id); setEditShowBookTagSuggestions(false); }}>{tag.name}</div>
                                                ))}
                                                {editBookTagInput.length > 0 && !bookTags.some((t) => t.name.toLowerCase() === editBookTagInput.toLowerCase()) && (
                                                    <div className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm text-green-700 border-t min-h-[44px] flex items-center" onMouseDown={async () => {
                                                        const result = await createBookTag(studentDocId, editBookTagInput);
                                                        if (result.success && result.tagId) { setEditSelectedBookTagId(result.tagId); const list = await getBookTags(studentDocId); setBookTags(list as { id: string; name: string }[]); }
                                                        setEditShowBookTagSuggestions(false);
                                                    }}>+ 새 태그: <strong>{editBookTagInput}</strong></div>
                                                )}
                                            </div>
                                        )}
                                        {editSelectedBookTagId && <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-700">저장됨</Badge>}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-semibold">오답 유형</Label>
                                    <Select value={editErrorType} onValueChange={setEditErrorType}>
                                        <SelectTrigger className="w-full min-h-[44px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="C">개념(C)</SelectItem>
                                            <SelectItem value="M">계산(M)</SelectItem>
                                            <SelectItem value="R">독해(R)</SelectItem>
                                            <SelectItem value="S">전략(S)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-semibold">틀린 횟수</Label>
                                    <Select value={String(editRetryCount)} onValueChange={(v) => setEditRetryCount(Number(v))}>
                                        <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder="틀린 횟수 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}회</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-semibold">메모 / 풀이</Label>
                                    <Textarea placeholder="틀린 이유나 올바른 풀이 과정" className="h-32 resize-none min-h-[44px]" value={editMemo} onChange={(e) => setEditMemo(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 min-h-[44px]">
                                    <Checkbox id="edit-resolved" checked={editIsResolved} onCheckedChange={(v) => setEditIsResolved(!!v)} />
                                    <Label htmlFor="edit-resolved" className="cursor-pointer">해결됨으로 표시</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold">사진 첨부 (이미지/문서)</Label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer min-h-[120px]" onClick={() => document.getElementById("edit-file-upload")?.click()}>
                                        <div className="bg-blue-50 text-blue-600 p-3 rounded-full mb-3">
                                            {editIsUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">클릭하여 파일 업로드</p>
                                        <p className="text-xs text-gray-400 mt-1">이미지는 자동 압축됩니다.</p>
                                        <Input id="edit-file-upload" type="file" className="hidden" multiple accept="image/*,.pdf,.hwp,.docx" onChange={handleEditFileUpload} disabled={editIsUploading} />
                                    </div>
                                    {editAttachments.length > 0 && (
                                        <div className="grid grid-cols-1 gap-2 mt-4">
                                            {editAttachments.map((file) => (
                                                <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {file.type === "image" ? (
                                                            <div className="h-10 w-10 relative rounded overflow-hidden flex-shrink-0 bg-gray-100 border">
                                                                <img src={file.downloadUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded text-gray-500 flex-shrink-0">
                                                                <FileText className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-700 truncate">{file.originalName}</p>
                                                            <p className="text-xs text-gray-400">{(file.sizeBytes / 1024).toFixed(1)} KB {file.compressed && <span className="text-green-600 font-bold">(압축됨)</span>}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); removeEditAttachment(file.id); }}><X className="h-4 w-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {Object.entries(editUploadProgress).map(([key, value]) => value < 100 ? (
                                        <div key={key} className="space-y-1">
                                            <div className="flex justify-between text-xs text-gray-500"><span>업로드 중...</span><span>{Math.round(value)}%</span></div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${value}%` }} /></div>
                                        </div>
                                    ) : null)}
                                </div>
                            </div>
                        </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button variant="destructive" onClick={handleDeleteNote} disabled={isPending} className="mr-auto">
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={closeEditNote}>취소</Button>
                            <Button onClick={handleSaveNoteEdit} disabled={isPending}>
                                {isPending ? "저장 중..." : "저장"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Zoom Modal */}
            <Dialog open={!!selectedZoomImg} onOpenChange={(open) => !open && setSelectedZoomImg(null)}>
                <DialogContent className="max-w-[95vw] w-fit p-1 bg-black/90 border-none">
                    <DialogTitle className="sr-only">이미지 확대</DialogTitle>
                    <DialogDescription className="sr-only">선택한 오답노트 이미지를 크게 봅니다.</DialogDescription>
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
