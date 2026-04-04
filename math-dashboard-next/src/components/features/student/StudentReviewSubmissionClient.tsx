"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { formatReviewDeadlineCountdown, isPastReviewDeadline } from "@/lib/reviewSubmissionDeadline";
import { studentSubmitReviewPhotos } from "@/actions/review-submission-actions";
import type { ReviewFeedbackStatus, ReviewProblem } from "@/types/review-submission";

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
    /** problemId → 현재 제출 예정 URL 목록 (서버 submissions와 동기, key 리마운트로 갱신) */
    const [photoUrlsByProblem, setPhotoUrlsByProblem] = useState<Record<string, string[]>>(() =>
        Object.fromEntries(initialProblems.map((p) => [p.id, [...(p.submissions || [])]]))
    );
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [submittingId, setSubmittingId] = useState<string | null>(null);

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
                // 오답 노트(StudentIncorrectNotesClient)와 동일: image/* 는 압축 시도 후 업로드
                let uploadFile: File | Blob = file;
                const isImage = file.type.startsWith("image/");

                if (isImage) {
                    try {
                        const compressedFile = await imageCompression(file, {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                            initialQuality: 0.7,
                        });
                        uploadFile = compressedFile;
                    } catch (err) {
                        console.error("Compression failed, using original", err);
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

                setPhotoUrlsByProblem((prev) => ({
                    ...prev,
                    [problemId]: [...(prev[problemId] || []), json.downloadUrl as string],
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

    const removeUrl = (problemId: string, index: number) => {
        setPhotoUrlsByProblem((prev) => {
            const list = [...(prev[problemId] || [])];
            list.splice(index, 1);
            return { ...prev, [problemId]: list };
        });
    };

    const handleSubmit = async (problemId: string) => {
        const urls = photoUrlsByProblem[problemId] || [];
        if (urls.length === 0) {
            alert("사진을 한 장 이상 추가해 주세요.");
            return;
        }
        setSubmittingId(problemId);
        const res = await studentSubmitReviewPhotos(studentDocId, problemId, urls);
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
                            urls={photoUrlsByProblem[p.id] || []}
                            uploading={uploadingId === p.id}
                            submitting={submittingId === p.id}
                            onFileChange={(e) => onFileChange(p.id, e)}
                            onRemoveUrl={(i) => removeUrl(p.id, i)}
                            onSubmit={() => handleSubmit(p.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function ProblemCard({
    problem: p,
    readOnly,
    urls,
    uploading,
    submitting,
    onFileChange,
    onRemoveUrl,
    onSubmit,
}: {
    problem: ReviewProblem;
    readOnly: boolean;
    urls: string[];
    uploading: boolean;
    submitting: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveUrl: (index: number) => void;
    onSubmit: () => void;
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
                    {urls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {urls.map((url, i) => (
                                <div key={i} className="relative group">
                                    <img src={url} alt="" className="h-28 w-auto max-w-[160px] object-cover rounded border" />
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => onRemoveUrl(i)}
                                        aria-label="이 사진 제거"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button type="button" size="sm" onClick={onSubmit} disabled={submitting || urls.length === 0}>
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
                    {urls.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                    <img src={url} alt="" className="h-28 w-auto max-w-[160px] object-cover rounded border" />
                                </a>
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
