import { cn } from "@/lib/utils";

/** 오답노트·복습 제출 등: 업로드량 + 압축 성공/실패 안내 (동일 규칙) */
export function PhotoUploadMetaCaption({
    sizeKb,
    compressed,
    compressionFailed,
    className,
}: {
    sizeKb: number | null | undefined;
    compressed?: boolean;
    compressionFailed?: boolean;
    className?: string;
}) {
    if (sizeKb == null || Number.isNaN(sizeKb)) return null;
    return (
        <p className={cn("text-xs text-gray-600 mt-1 leading-tight text-center", className)}>
            <span className="font-medium text-gray-800">{sizeKb.toFixed(1)} KB</span>
            {compressed ? (
                <span className="text-green-600 font-bold ml-1">(압축됨)</span>
            ) : null}
            {compressionFailed && !compressed ? (
                <span className="text-amber-600 font-semibold ml-1">압축 실패 · 다시 시도</span>
            ) : null}
        </p>
    );
}
