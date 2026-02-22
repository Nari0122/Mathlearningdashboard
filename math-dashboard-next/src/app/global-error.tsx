"use client";

/**
 * 루트 레벨 서버/클라이언트 예외 처리.
 * 프로덕션에서 "Application error: a server-side exception" 대신 이 UI가 표시됩니다.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="ko">
            <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f3f4f6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", padding: "2rem", maxWidth: "400px" }}>
                    <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111", marginBottom: "0.5rem" }}>
                        일시적인 오류가 발생했습니다
                    </h1>
                    <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                        잠시 후 다시 시도하거나 로그인 페이지로 이동해 주세요.
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={() => reset()}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#2563eb",
                                color: "white",
                                border: "none",
                                borderRadius: "0.375rem",
                                fontWeight: 500,
                                cursor: "pointer",
                            }}
                        >
                            다시 시도
                        </button>
                        <a
                            href="/login"
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#fff",
                                color: "#2563eb",
                                border: "1px solid #2563eb",
                                borderRadius: "0.375rem",
                                fontWeight: 500,
                                textDecoration: "none",
                            }}
                        >
                            로그인으로 이동
                        </a>
                    </div>
                </div>
            </body>
        </html>
    );
}
