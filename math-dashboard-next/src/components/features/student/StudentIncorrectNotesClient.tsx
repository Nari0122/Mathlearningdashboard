"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Plus, FileImage, X, Trash2, Pencil, BookMarked } from "lucide-react";
import { createIncorrectNote, deleteIncorrectNote, updateIncorrectNote, getBookTags, createBookTag } from "@/actions/learning-actions";
import { SCHOOL_LEVELS, GRADES, SUBJECTS, getUnits, CURRICULUM_DATA, isMiddleSchool } from "@/lib/curriculum-data";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";
import { Progress } from "@/components/ui/progress"; // Assuming shadcn Progress component exists, or I will use simple div
import { FileText, Loader2 } from "lucide-react";
import { useReadOnly } from "@/contexts/ReadOnlyContext";

interface Attachment {
    id: string;
    originalName: string;
    storagePath: string;
    downloadUrl: string;
    type: "image" | "file";
    sizeBytes: number;
    contentType: string;
    width?: number;
    height?: number;
    compressed?: boolean;
}

interface StudentIncorrectNotesClientProps {
    studentDocId: string;
    notes: any[];
    units: any[];
}

export default function StudentIncorrectNotesClient({ studentDocId, notes, units }: StudentIncorrectNotesClientProps) {
    const router = useRouter();
    const readOnly = useReadOnly();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [selectedZoomImg, setSelectedZoomImg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filter State (for notes list)
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterGrade, setFilterGrade] = useState<string>("all");
    const [filterSubject, setFilterSubject] = useState<string>("all");
    const [filterUnitName, setFilterUnitName] = useState<string>("all");
    const [filterDetail, setFilterDetail] = useState<string>("all");
    // Extended filters - multi-select
    const [filterErrorTypes, setFilterErrorTypes] = useState<string[]>([]);
    const [filterRetryCounts, setFilterRetryCounts] = useState<number[]>([]);
    const [filterBookTagIds, setFilterBookTagIds] = useState<string[]>([]);

    // 5-Level Selection State (for Add Modal)
    const [selLevel, setSelLevel] = useState<string>("");
    const [selGrade, setSelGrade] = useState<string>("");
    const [selSubject, setSelSubject] = useState<string>("");
    const [selUnitName, setSelUnitName] = useState<string>("");
    const [selDetail, setSelDetail] = useState<string>("");

    // Reset logic for modal
    useEffect(() => { setSelGrade(""); setSelSubject(""); setSelUnitName(""); setSelDetail(""); }, [selLevel]);
    useEffect(() => { setSelSubject(""); setSelUnitName(""); setSelDetail(""); }, [selGrade]);
    useEffect(() => { setSelUnitName(""); setSelDetail(""); }, [selSubject]);
    useEffect(() => { setSelDetail(""); }, [selUnitName]);

    // Reset filter logic
    useEffect(() => { setFilterGrade("all"); setFilterSubject("all"); setFilterUnitName("all"); setFilterDetail("all"); }, [filterLevel]);
    useEffect(() => { setFilterSubject("all"); setFilterUnitName("all"); setFilterDetail("all"); }, [filterGrade]);
    useEffect(() => { setFilterUnitName("all"); setFilterDetail("all"); }, [filterSubject]);
    useEffect(() => { setFilterDetail("all"); }, [filterUnitName]);

    // Derived Lists from Full Curriculum Data
    const levels = SCHOOL_LEVELS;

    const grades = useMemo(() => {
        if (!selLevel) return [];
        return GRADES[selLevel as keyof typeof GRADES] || [];
    }, [selLevel]);

    const subjects = useMemo(() => {
        if (!selLevel || !selGrade) return [];
        return SUBJECTS[selLevel as keyof typeof SUBJECTS]?.[selGrade] || [];
    }, [selLevel, selGrade]);

    const unitList = useMemo(() => {
        if (!selSubject || !selGrade) return [];
        return getUnits(selSubject, selGrade);
    }, [selSubject, selGrade]);

    const details = useMemo(() => {
        if (!selUnitName) return [];
        const unit = unitList.find(u => u.unit === selUnitName);
        return unit?.details || [];
    }, [unitList, selUnitName]);

    // Filter Options (for notes list) - derived from actual notes data
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

    const [formData, setFormData] = useState({
        bookName: "",
        page: "",
        number: "",
        memo: "",
        errorType: "C",
        questionImg: "", // Legacy backward compatibility or simple preview
        retryCount: "",
    });

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [isUploading, setIsUploading] = useState(false);

    // BookTag state
    const [bookTags, setBookTags] = useState<{ id: string; name: string }[]>([]);
    const [bookTagInput, setBookTagInput] = useState("");
    const [selectedBookTagId, setSelectedBookTagId] = useState<string | null>(null);
    const [showBookTagSuggestions, setShowBookTagSuggestions] = useState(false);

    // Fetch book tags on mount
    useEffect(() => {
        const fetchTags = async () => {
            const tags = await getBookTags(studentDocId);
            setBookTags(tags as { id: string; name: string }[]);
        };
        fetchTags();
    }, [studentDocId]);

    const handleOpenAdd = () => {
        setModalMode('add');
        setEditingNoteId(null);
        setSelLevel("");
        setFormData({
            bookName: "",
            page: "",
            number: "",
            memo: "",
            errorType: "C",
            questionImg: "",
            retryCount: "",
        });
        setAttachments([]);
        setUploadProgress({});
        setBookTagInput("");
        setSelectedBookTagId(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (note: any) => {
        setModalMode('edit');
        setEditingNoteId(note.id);

        // Populate curriculum selection
        const schoolLevel = note.unit?.schoolLevel || note.schoolLevel || "";
        const grade = note.unit?.grade || note.grade || "";
        const subject = note.unit?.subject || note.subject || "";
        const unitName = note.unit?.unitName || note.unit?.name || note.unitName || "";
        const unitDetail = note.unitDetail || "";

        setSelLevel(schoolLevel);
        // We need to wait for useEffects to trigger or manually set them if we want immediate sync,
        // but since these are controlled, setting them in sequence or using a timeout is sometimes needed
        // however, the simplest is to set them and let the component re-render.
        setTimeout(() => {
            setSelGrade(grade);
            setTimeout(() => {
                setSelSubject(subject);
                setTimeout(() => {
                    setSelUnitName(unitName);
                    setTimeout(() => {
                        setSelDetail(unitDetail);
                    }, 0);
                }, 0);
            }, 0);
        }, 0);

        // Parse problemName back into fields if possible
        const problemName = note.problemName || "";
        const match = problemName.match(/(.*)\s+(\d+)p\s+(\d+)번/);

        if (match) {
            setFormData({
                bookName: match[1],
                page: match[2],
                number: match[3],
                memo: note.memo || "",
                errorType: note.errorType || "C",
                questionImg: note.questionImg || "",
                retryCount: note.retryCount ? String(note.retryCount) : "",
            });
        } else {
            setFormData({
                bookName: problemName,
                page: "",
                number: "",
                memo: note.memo || "",
                errorType: note.errorType || "C",
                questionImg: note.questionImg || "",
                retryCount: note.retryCount ? String(note.retryCount) : "",
            });
        }

        // Load attachments if any (check both note.attachments and legacy questionImg)
        const loadedAttachments: Attachment[] = note.attachments || [];
        setAttachments(loadedAttachments);

        // Load bookTag if any
        if (note.bookTagId) {
            setSelectedBookTagId(note.bookTagId);
            const matchingTag = bookTags.find(t => t.id === note.bookTagId);
            setBookTagInput(matchingTag?.name || "");
        } else {
            setSelectedBookTagId(null);
            setBookTagInput("");
        }

        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const isMiddle = selLevel && isMiddleSchool(selLevel);

        if (!selLevel || !selGrade || !selSubject || !selUnitName || !formData.bookName || (!isMiddle && !selDetail)) {
            alert(isMiddle ? "학제, 학년, 과목, 단원, 교재명을 모두 입력해주세요." : "학제, 학년, 과목, 단원, 세부내용, 교재명을 모두 입력해주세요.");
            return;
        }
        if (!formData.page?.trim()) {
            alert("페이지를 입력해주세요.");
            return;
        }
        if (!formData.number?.trim()) {
            alert("문제 번호를 입력해주세요.");
            return;
        }
        if (!formData.retryCount) {
            alert("틀린 횟수를 선택해주세요.");
            return;
        }
        if (!formData.memo?.trim()) {
            alert("메모/풀이를 입력해주세요.");
            return;
        }

        setIsLoading(true);

        const combinedName = `${formData.bookName} ${formData.page ? `${formData.page}p ` : ''}${formData.number ? `${formData.number}번` : ''}`.trim();

        const payload = {
            problemName: combinedName,
            memo: formData.memo,
            errorType: formData.errorType,
            questionImg: formData.questionImg,
            unitDetail: isMiddle ? "" : selDetail,
            schoolLevel: selLevel,
            grade: selGrade,
            subject: selSubject,
            unitName: selUnitName,
            retryCount: formData.retryCount ? parseInt(formData.retryCount) : undefined,
            attachments: attachments,
            bookTagId: selectedBookTagId || undefined,
        };

        let result;
        if (modalMode === 'add') {
            // Find matching unit from student's units
            let matchingUnit = units.find(u =>
                u.schoolLevel === selLevel &&
                u.grade === selGrade &&
                u.subject === selSubject &&
                (u.unitName || u.name) === selUnitName
            );
            const unitIdToUse = matchingUnit ? matchingUnit.id : 0;

            result = await createIncorrectNote(studentDocId, {
                ...payload,
                unitId: unitIdToUse,
            });
        } else {
            result = await updateIncorrectNote(studentDocId, editingNoteId!, payload);
        }

        setIsLoading(false);

        if (result.success) {
            alert(modalMode === 'add' ? "오답노트가 등록되었습니다." : "오답노트가 수정되었습니다.");
            setIsModalOpen(false);
            router.refresh();
        } else {
            alert(result.message || "오답노트 저장 실패");
        }
    };

    const handleDelete = async (noteId: string) => {
        if (!confirm("정말 이 오답노트를 삭제하시겠습니까?")) return;

        setIsLoading(true);
        const result = await deleteIncorrectNote(studentDocId, noteId);
        setIsLoading(false);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.message || "삭제 실패");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const storageInstance = storage;
        if (!storageInstance) {
            alert("이미지 업로드를 사용하려면 Firebase Storage가 설정되어 있어야 합니다. Vercel 환경 변수에 NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET(또는 NEXT_PUBLIC_FIREBASE_PROJECT_ID)를 설정해 주세요.");
            return;
        }

        setIsUploading(true);
        const newAttachments: Attachment[] = []; // Collect successful uploads

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileId = uuidv4();
            const wrongNoteId = editingNoteId || "temp_" + Date.now();
            const isImage = file.type.startsWith("image/");

            try {
                let uploadFile = file;
                let compressed = false;
                let width, height;

                // 1. Image Compression
                if (isImage) {
                    const options = {
                        maxSizeMB: 1, // Start small
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                        initialQuality: 0.7,
                    };
                    try {
                        const compressedFile = await imageCompression(file, options);
                        uploadFile = compressedFile;
                        compressed = true;

                        // Get dimensions if possible (optional)
                    } catch (err) {
                        console.error("Compression failed, using original", err);
                    }
                }

                // 2. Upload to Firebase Storage
                // Path: students/{studentDocId}/wrongNotes/{wrongNoteId}/attachments/{fileId}_{filename}
                const storagePath = `students/${studentDocId}/wrongNotes/${wrongNoteId}/attachments/${fileId}_${file.name}`;
                const storageRef = ref(storageInstance, storagePath);

                const uploadTask = uploadBytesResumable(storageRef, uploadFile);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
                        },
                        (error) => {
                            console.error("Upload error:", error);
                            reject(error);
                        },
                        () => {
                            resolve();
                        }
                    );
                });

                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

                const attachment: Attachment = {
                    id: fileId,
                    originalName: file.name,
                    storagePath: storagePath,
                    downloadUrl: downloadUrl,
                    type: isImage ? "image" : "file",
                    sizeBytes: uploadFile.size,
                    contentType: uploadFile.type,
                    compressed: compressed,
                };

                // Add to list immediately
                setAttachments(prev => [...prev, attachment]);

            } catch (error) {
                console.error(`Failed to upload ${file.name}`, error);
                alert(`${file.name} 업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
            }
        }

        setIsUploading(false);
        // Reset file input
        e.target.value = "";
    };

    const removeAttachment = (id: string) => {
        if (!confirm("첨부파일을 목록에서 삭제하시겠습니까? (저장 시 반영됨)")) return;
        setAttachments(prev => prev.filter(a => a.id !== id));
        // Note: Real deletion from Storage could happen here or on save. 
        // For simplicity, we just remove from the list to be saved. 
        // Orphaned files in Storage can be cleaned up periodically or we can implement direct delete.
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
                {!readOnly && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <Button className="bg-blue-600 hover:bg-blue-700 shrink-0 min-h-[44px] px-5" onClick={handleOpenAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        오답노트 작성
                    </Button>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{modalMode === 'add' ? '오답노트 작성' : '오답노트 수정'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            {/* 5-Level Selection Grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">학제</Label>
                                    <Select value={selLevel} onValueChange={setSelLevel}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="학제 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {levels.map((l: any) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">학년</Label>
                                    <Select value={selGrade} onValueChange={setSelGrade} disabled={!selLevel}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="학년 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {grades.map((g: any) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">과목/영역</Label>
                                    <Select value={selSubject} onValueChange={setSelSubject} disabled={!selGrade}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="과목 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((s: any) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">단원</Label>
                                    <Select value={selUnitName} onValueChange={setSelUnitName} disabled={!selSubject}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="단원 선택" /></SelectTrigger>
                                        <SelectContent>
                                            {unitList.map((u: any) => (
                                                <SelectItem key={u.unit} value={u.unit}>{u.unit}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 세부내용 - 고등만 표시 */}
                                {!isMiddleSchool(selLevel || "") && (
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-xs font-bold text-gray-500 uppercase">세부내용</Label>
                                        <Select value={selDetail} onValueChange={setSelDetail} disabled={!selUnitName || details.length === 0}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder={details.length > 0 ? "세부내용 선택" : "세부내용 없음"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {details.map((d: any) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
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
                                            <Input
                                                placeholder="교재명 (예: 쎈)"
                                                value={formData.bookName}
                                                onChange={(e) => setFormData({ ...formData, bookName: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Input
                                                placeholder="페이지"
                                                value={formData.page}
                                                onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                                                className="pr-6"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">p</span>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                placeholder="번호"
                                                value={formData.number}
                                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                                className="pr-6"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">번</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="font-semibold">문제집 태그 (선택)</Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="태그 입력 (예: 쎈, 블랙라벨)"
                                            value={bookTagInput}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\s/g, '');
                                                setBookTagInput(val);
                                                setSelectedBookTagId(null);
                                                setShowBookTagSuggestions(val.length > 0);
                                            }}
                                            onFocus={() => setShowBookTagSuggestions(bookTagInput.length > 0 || bookTags.length > 0)}
                                            onBlur={() => setTimeout(() => setShowBookTagSuggestions(false), 150)}
                                        />
                                        {showBookTagSuggestions && (
                                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                {bookTags
                                                    .filter(t => t.name.toLowerCase().includes(bookTagInput.toLowerCase()))
                                                    .slice(0, 5)
                                                    .map(tag => (
                                                        <div
                                                            key={tag.id}
                                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm min-h-[44px] flex items-center"
                                                            onMouseDown={() => {
                                                                setBookTagInput(tag.name);
                                                                setSelectedBookTagId(tag.id);
                                                                setShowBookTagSuggestions(false);
                                                            }}
                                                        >
                                                            {tag.name}
                                                        </div>
                                                    ))
                                                }
                                                {bookTagInput.length > 0 && !bookTags.some(t => t.name.toLowerCase() === bookTagInput.toLowerCase()) && (
                                                    <div
                                                        className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm text-green-700 border-t min-h-[44px] flex items-center"
                                                        onMouseDown={async () => {
                                                            const result = await createBookTag(studentDocId, bookTagInput);
                                                            if (result.success && result.tagId) {
                                                                setSelectedBookTagId(result.tagId);
                                                                const newTags = await getBookTags(studentDocId);
                                                                setBookTags(newTags as { id: string; name: string }[]);
                                                            }
                                                            setShowBookTagSuggestions(false);
                                                        }}
                                                    >
                                                        + 새 태그: <strong>{bookTagInput}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {selectedBookTagId && (
                                            <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-700">
                                                저장됨
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="font-semibold">오답 유형</Label>
                                    <Select value={formData.errorType} onValueChange={(val) => setFormData({ ...formData, errorType: val })}>
                                        <SelectTrigger className="w-full min-h-[44px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="C">개념(C) - 공식이나 정의를 모름</SelectItem>
                                            <SelectItem value="M">계산(M) - 풀이 과정 중 실수</SelectItem>
                                            <SelectItem value="R">독해(R) - 문제 요구사항 해석 오류</SelectItem>
                                            <SelectItem value="S">전략(S) - 접근 방법 못 찾음</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="font-semibold">틀린 횟수</Label>
                                    <Select
                                        value={formData.retryCount ? String(formData.retryCount) : ""}
                                        onValueChange={(val) => setFormData({ ...formData, retryCount: val })}
                                    >
                                        <SelectTrigger className="w-full min-h-[44px]">
                                            <SelectValue placeholder="틀린 횟수 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
                                                <SelectItem key={num} value={String(num)}>{num}회</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="font-semibold">메모 / 풀이</Label>
                                    <Textarea
                                        placeholder="틀린 이유나 올바른 풀이 과정을 기록하세요."
                                        className="h-32 min-h-[44px]"
                                        value={formData.memo}
                                        onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-semibold">사진 첨부 (이미지/문서)</Label>
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer min-h-[120px]"
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        <div className="bg-blue-50 text-blue-600 p-3 rounded-full mb-3">
                                            {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">클릭하여 파일 업로드</p>
                                        <p className="text-xs text-gray-400 mt-1">이미지는 자동 압축됩니다. (최대 10장)</p>
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="image/*,.pdf,.hwp,.docx"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                    </div>
                                    {attachments.length > 0 && (
                                        <div className="grid grid-cols-1 gap-2 mt-4">
                                            {attachments.map((file) => (
                                                <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {file.type === 'image' ? (
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
                                                            <p className="text-xs text-gray-400">
                                                                {(file.sizeBytes / 1024).toFixed(1)} KB {file.compressed && <span className="text-green-600 font-bold">(압축됨)</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); removeAttachment(file.id); }}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {Object.entries(uploadProgress).map(([key, value]) => (
                                        value < 100 && (
                                            <div key={key} className="space-y-1">
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>업로드 중...</span>
                                                    <span>{Math.round(value)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${value}%` }} />
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="pt-4 border-t flex flex-col sm:flex-row gap-2">
                            <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                                {modalMode === 'add' ? '오답노트 등록' : '수정 완료'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                )}
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
                                            <Badge variant="outline" className="bg-white shrink-0">
                                                {note.unit
                                                    ? `[${note.unit.schoolLevel || ''}] ${note.unit.grade} ${note.unit.subject}`
                                                    : (note.schoolLevel ? `[${note.schoolLevel}] ${note.grade} ${note.subject}` : "단원 미지정")}
                                            </Badge>
                                            <Badge variant="outline" className="bg-white font-medium shrink-0">
                                                {note.unit?.unitName || note.unit?.name || note.unitName || "단원 미지정"}
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
                                        {!readOnly && (
                                        <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => handleEditClick(note)}
                                            disabled={isLoading}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(note.id)}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        </>
                                        )}
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
                                        <h4 className="text-sm font-semibold text-gray-700">이미지 첨부</h4>
                                        <h4 className="text-sm font-semibold text-gray-700">첨부 파일</h4>

                                        {/* Display Attachments Grid */}
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
                                                                className="w-full h-full object-contain"
                                                            />
                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate px-2">
                                                                {att.originalName}
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
                                            /* Legacy Backward Compatibility */
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
                                                        <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-gray-900 border-none shadow-lg">
                                                            클릭하여 확대보기
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
                    <DialogTitle className="sr-only">이미지 확대</DialogTitle>
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
