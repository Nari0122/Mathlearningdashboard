"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { formatReviewDeadlineCountdown, isPastReviewDeadline } from "@/lib/reviewSubmissionDeadline";
import { studentSubmitReviewPhotos } from "@/actions/review-submission-actions";
import type { ReviewFeedbackStatus, ReviewProblem, ReviewSubmissionPhoto } from "@/types/review-submission";
import { PhotoUploadMetaCaption } from "@/components/shared/PhotoUploadMetaCaption";

const ACCEPT_IMAGES = "image/jpeg,image/png,image/heic,image/heif,.heic,.heif";

function formatDateTime(dateString: string | Date | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

const STATUS_LABEL: Record<ReviewFeedbackStatus, string> = {
    good: "잘했어요 ✅",
    redo: "다시 풀어봐요 🔁",
    checking: "확인 중 👀",
};

function useTickingCountdown(deadlineIso: string) {
    const [label, setLabel] = useState<string | null>(null);
    useEffect(() => {
        const tick = () => setLabel(formatReviewDeadlineCountdown(deadlineIso).label);
        tick();
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, [deadlineIso]);
    return label;
}

interface StudentReviewSubmissionClientProps {
    problems: ReviewProblem[];
    studentDocId: string;
}

export default function StudentReviewSubmissionClient({
    problems: initialProblems,
    studentDocId,
}: StudentReviewSubmissionClientProps) {
    const router = useRouter();
    const readOnly = useReadOnly();
    /** problemId → 제출 예정 사진 (오답 노트와 동일: 용량·압축됨·압축 실패 안내) */
    const [photosByProblem, setPhotosByProblem] = useState<Record<string, ReviewSubmissionPhoto[]>>(() =>
        Object.fromEntries(
            initialProblems.map((p) => [
                p.id,
                (p.submissions || []).map((s) => ({
                    url: s.url,
                    sizeKb: s.sizeKb,
                    compressed: s.compressed,
                    compressionFailed: s.compressionFailed,
                })),
            ])
        )
    );
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [selectedZoomImg, setSelectedZoomImg] = useState<string | null>(null);

    const uploadOne = useCallback(
        async (problemId: string, file: File) => {
            const lower = file.name.toLowerCase();
            const okExt = /\.(jpe?g|png|heic|heif)$/i.test(lower);
            const okType =
                file.type.startsWith("image/") ||
                file.type === "image/heic" ||
                file.type === "image/heif" ||
                okExt;
            if (!okType) {
                alert("JPG, PNG, HEIC 형식만 업로드할 수 있습니다.");
                return;
            }

            setUploadingId(problemId);
            try {
                let uploadFile: File | Blob = file;
                const isImage =
                    file.type.startsWith("image/") ||
                    file.type === "image/heic" ||
                    file.type === "image/heif" ||
                    okExt;
                let compressed = false;
                let compressionFailed = false;

                if (isImage) {
                    try {
                        const compressedFile = await imageCompression(file, {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                            initialQuality: 0.7,
                        });
                        uploadFile = compressedFile;
                        compressed = true;
                    } catch (err) {
                        console.error("Compression failed, using original", err);
                        compressionFailed = true;
                    }
                }

                const fileId = uuidv4();
                const storagePath = `students/${studentDocId}/reviewSubmissions/${problemId}/${fileId}_${file.name}`;

                const formData = new FormData();
                formData.append("file", uploadFile, file.name);
                formData.append("storagePath", storagePath);

                const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.message || "업로드 실패");

                const sizeKb = uploadFile.size / 1024;
                setPhotosByProblem((prev) => ({
                    ...prev,
                    [problemId]: [
                        ...(prev[problemId] || []),
                        { url: json.downloadUrl as string, sizeKb, compressed, compressionFailed },
                    ],
                }));
            } catch (e) {
                alert(e instanceof Error ? e.message : "업로드에 실패했습니다.");
            } finally {
                setUploadingId(null);
            }
        },
        [studentDocId]
    );

    const onFileChange = (problemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        void (async () => {
            for (let i = 0; i < files.length; i++) {
                await uploadOne(problemId, files[i]);
            }
        })();
        e.target.value = "";
    };

    const removePhoto = (problemId: string, index: number) => {
        setPhotosByProblem((prev) => {
            const list = [...(prev[problemId] || [])];
            list.splice(index, 1);
            return { ...prev, [problemId]: list };
        });
    };

    const handleSubmit = async (problemId: string) => {
        const items = photosByProblem[problemId] || [];
        if (items.length === 0) {
            alert("사진을 한 장 이상 추가해 주세요.");
            return;
        }
        setSubmittingId(problemId);
        const res = await studentSubmitReviewPhotos(studentDocId, problemId, items);
        setSubmittingId(null);
        if (res.success) router.refresh();
        else alert(res.message);
    };

    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <PageHeader
                title={readOnly ? "복습 제출 (읽기 전용)" : "복습 제출"}
                description={
                    readOnly
                        ? "자녀가 제출한 복습 풀이와 선생님 피드백을 확인할 수 있습니다."
                        : "선생님이 등록한 문제에 맞춰 손풀이 사진을 올려 주세요."
                }
                icon={
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F3FF]">
                        <Camera className="w-6 h-6 text-[#5D00E2]" />
                    </div>
                }
            />

            <div className="space-y-4">
                {initialProblems.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed text-gray-500">
                        등록된 복습 문제가 없습니다.
                    </div>
                ) : (
                    initialProblems.map((p) => (
                        <ProblemCard
                            key={p.id}
                            problem={p}
                            readOnly={readOnly}
                            photos={photosByProblem[p.id] || []}
                            uploading={uploadingId === p.id}
                            submitting={submittingId === p.id}
                            onFileChange={(e) => onFileChange(p.id, e)}
                            onRemovePhoto={(i) => removePhoto(p.id, i)}
                            onSubmit={() => handleSubmit(p.id)}
                            onOpenZoom={setSelectedZoomImg}
                        />
                    ))
                )}
            </div>

            <Dialog open={!!selectedZoomImg} onOpenChange={(open) => !open && setSelectedZoomImg(null)}>
                <DialogContent showCloseButton={false} className="max-w-[95vw] w-fit p-1 bg-black/90 border-none">
                    <DialogTitle className="sr-only">이미지 확대</DialogTitle>
                    {selectedZoomImg && (
                        <div className="relative flex items-center justify-center min-h-[50vh]">
                            <img
                                src={selectedZoomImg}
                                alt="제출 사진 확대"
                                className="max-h-[85vh] max-w-full object-contain"
                            />
                            <Button
                                type="button"
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

function ProblemCard({
    problem: p,
    readOnly,
    photos,
    uploading,
    submitting,
    onFileChange,
    onRemovePhoto,
    onSubmit,
    onOpenZoom,
}: {
    problem: ReviewProblem;
    readOnly: boolean;
    photos: ReviewSubmissionPhoto[];
    uploading: boolean;
    submitting: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemovePhoto: (index: number) => void;
    onSubmit: () => void;
    onOpenZoom: (url: string) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const countdownLabel = useTickingCountdown(p.deadline);
    const pastDeadline = isPastReviewDeadline(p.deadline);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 space-y-3 shadow-sm">
            <div className="space-y-1">
                <h3 className="font-semibold text-base">{p.bookAndProblem}</h3>
                <p className="text-sm text-muted-foreground">단원: {p.unitName}</p>
                <p
                    className={`text-sm font-medium ${
                        countdownLabel === null ? "text-muted-foreground" : pastDeadline ? "text-gray-500" : "text-blue-600"
                    }`}
                >
                    {countdownLabel ?? "남은 시간 계산 중…"}
                </p>
                <p className="text-xs text-gray-500">마감: {formatDateTime(p.deadline)}</p>
            </div>

            {!readOnly && (
                <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-medium text-gray-500">사진 업로드 (여러 장 가능 · JPG, PNG, HEIC)</p>
                    <p className="text-[11px] text-muted-foreground">
                        이미지는 자동 압축을 시도합니다. 성공 시 썸네일 아래에 용량과 <span className="text-green-600 font-bold">(압축됨)</span>이 표시되고, 실패 시 원본으로 올리며{" "}
                        <span className="text-amber-600 font-semibold">압축 실패 · 다시 시도</span> 안내가 보입니다.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPT_IMAGES}
                            multiple
                            className="hidden"
                            disabled={uploading}
                            onChange={onFileChange}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? "업로드 중…" : "사진 추가"}
                        </Button>
                        {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {photos.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {photos.map((item, i) => (
                                <div key={i} className="relative group w-[min(160px,100%)]">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in"
                                        onClick={() => onOpenZoom(item.url)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                onOpenZoom(item.url);
                                            }
                                        }}
                                    >
                                        <img
                                            src={item.url}
                                            alt=""
                                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-[10px] font-medium bg-white/90 text-gray-900 px-2 py-1 rounded shadow">
                                                클릭하여 확대
                                            </span>
                                        </div>
                                    </div>
                                    <PhotoUploadMetaCaption
                                        sizeKb={item.sizeKb}
                                        compressed={item.compressed}
                                        compressionFailed={item.compressionFailed}
                                        className="text-[11px]"
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemovePhoto(i);
                                        }}
                                        aria-label="이 사진 제거"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button type="button" size="sm" onClick={onSubmit} disabled={submitting || photos.length === 0}>
                        {submitting ? "제출 중…" : p.submittedAt ? "다시 제출" : "제출하기"}
                    </Button>
                    {p.submittedAt && (
                        <p className="text-xs text-gray-500">
                            마지막 제출: {formatDateTime(p.submittedAt)}
                            {p.isLateSubmit && <span className="ml-2 text-amber-600 font-medium">⚠️ 마감 후 제출됨</span>}
                            {!p.isLateSubmit && <span className="ml-2 text-green-700">정시 제출</span>}
                        </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                        마감 전에는 자유롭게 다시 제출할 수 있습니다. 마감 후에도 제출은 가능하며 &quot;마감 후 제출&quot;로 표시됩니다.
                    </p>
                </div>
            )}

            {readOnly && (
                <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-medium text-gray-500">제출 사진</p>
                    {photos.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {photos.map((item, i) => (
                                <div key={i} className="flex flex-col w-[min(160px,100%)]">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in group"
                                        onClick={() => onOpenZoom(item.url)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                onOpenZoom(item.url);
                                            }
                                        }}
                                    >
                                        <img
                                            src={item.url}
                                            alt=""
                                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-[10px] font-medium bg-white/90 text-gray-900 px-2 py-1 rounded shadow">
                                                클릭하여 확대
                                            </span>
                                        </div>
                                    </div>
                                    <PhotoUploadMetaCaption
                                        sizeKb={item.sizeKb}
                                        compressed={item.compressed}
                                        compressionFailed={item.compressionFailed}
                                        className="text-[11px]"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">제출 없음</p>
                    )}
                    {p.submittedAt && (
                        <p className="text-xs text-gray-500">
                            제출 시각: {formatDateTime(p.submittedAt)}
                            {p.isLateSubmit && <span className="ml-2 text-amber-600 font-medium">⚠️ 마감 후 제출됨</span>}
                            {!p.isLateSubmit && <span className="ml-2 text-green-700">제출 완료</span>}
                        </p>
                    )}
                </div>
            )}

            {(p.feedback || p.feedbackStatus) && (
                <div className="border-t pt-3 space-y-1">
                    <p className="text-xs font-medium text-gray-500">선생님 피드백</p>
                    {p.feedbackStatus && (
                        <span className="inline-block text-sm font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {STATUS_LABEL[p.feedbackStatus as ReviewFeedbackStatus]}
                        </span>
                    )}
                    {p.feedback && <p className="text-sm whitespace-pre-wrap">{p.feedback}</p>}
                </div>
            )}
        </div>
    );
}
