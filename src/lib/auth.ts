import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import { AUTH_SIGNUP_ROLE_COOKIE, getHomePathByRole } from "./auth-constants";
import { verifyKakaoIdToken } from "./verify-kakao-id-token";
import { studentService } from "@/services/studentService";
import { parentService } from "@/services/parentService";

export { AUTH_SIGNUP_ROLE_COOKIE, getHomePathByRole };

/** signIn에서 반환한 URL을 redirect 콜백에서 사용 */
let pendingSignInRedirectUrl: string | null = null;

/**
 * 소셜 로그인 후 리다이렉트 URL (역할 쿠키만 사용, users 컬렉션 미사용)
 * 원래 로직: 관리자/학생 로그인은 auth-actions + students 컬렉션. 여기서는 OAuth → 완료 페이지만.
 */
export function getSignInRedirectUrl(signupRole: string | undefined): string {
    if (signupRole === "PARENT") return "/signup/complete-parent";
    return "/signup/complete-student";
}

export function getAuthOptions(signupRoleCookie?: string): NextAuthOptions {
    return {
        providers: [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID ?? "",
                clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            }),
            KakaoProvider({
                clientId: process.env.KAKAO_CLIENT_ID ?? "",
                clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
                authorization: {
                    params: {
                        scope: "profile_nickname profile_image",
                        prompt: "login",
                    },
                },
            }),
            NaverProvider({
                clientId: process.env.NAVER_CLIENT_ID ?? "",
                clientSecret: process.env.NAVER_CLIENT_SECRET ?? "",
            }),
        ],
        callbacks: {
            async signIn({ user, account }) {
                try {
                    if (!account) return false;
                    const uid = String(account.providerAccountId ?? user.id ?? "");
                    if (!uid) return false;

                    // 카카오: 학생은 추가정보 입력 후 저장하기를 눌러야만 students 문서 생성. 여기서는 문서 유무만 확인 후 리다이렉트.
                    // ID 토큰 검증 실패 시에도 로그인 진행 (OAuth 코드 교환으로 이미 인증됨). 검증 실패는 로그만 남김.
                    if (account.provider === "kakao") {
                        const idToken = (account as { id_token?: string }).id_token;
                        if (idToken) {
                            const verified = await verifyKakaoIdToken(idToken);
                            if (!verified || verified.sub !== uid) {
                                console.warn("[signIn] Kakao ID token verification failed or sub mismatch; continuing login.");
                            }
                        }
                        const existingStudent = await studentService.getStudentByUid(uid);
                        if (existingStudent) {
                            const status = (existingStudent as { approvalStatus?: string }).approvalStatus;
                            if (status === "PENDING") {
                                pendingSignInRedirectUrl = "/pending-approval";
                            } else {
                                pendingSignInRedirectUrl = `/student/${existingStudent.id}`;
                            }
                            return true;
                        }
                        // 로그인 페이지에서 카카오 로그인 시 학부모 문서 있으면 학부모 대시보드로
                        const existingParent = await parentService.getParentByUid(uid);
                        if (existingParent) {
                            pendingSignInRedirectUrl = "/parent/dashboard";
                            return true;
                        }
                        pendingSignInRedirectUrl = "/signup/complete-student";
                        return true;
                    }

                    // 그 외(구글/네이버 등): 역할 쿠키 기준으로 완료 페이지로
                    const redirectUrl = getSignInRedirectUrl(signupRoleCookie);
                    pendingSignInRedirectUrl = redirectUrl;
                    return true;
                } catch (err) {
                    console.error("[signIn] Unexpected error:", err);
                    const fallback =
                        signupRoleCookie === "PARENT" ? "/signup/complete-parent" : "/signup/complete-student";
                    pendingSignInRedirectUrl = fallback;
                    return true;
                }
            },
            async jwt({ token, user, account }) {
                const safeToken = (token ?? {}) as Record<string, unknown>;
                const uidJwt = (safeToken.sub as string) ?? (account?.providerAccountId as string) ?? user?.id;
                if (uidJwt && !safeToken.sub) safeToken.sub = uidJwt;
                const uid = String(safeToken.sub ?? (account?.providerAccountId as string) ?? user?.id ?? "");
                if (uid) {
                    safeToken.uid = safeToken.uid ?? uid;
                    // users 컬렉션 미사용. 소셜 로그인은 항상 추가정보 완료 대기
                    safeToken.signupPending = true;
                }
                return safeToken;
            },
            async session({ session, token }) {
                if (session.user) {
                    (session.user as { id?: string }).id = (token.uid ?? token.sub) as string | undefined;
                    (session.user as { sub?: string }).sub = token.sub as string | undefined;
                    (session.user as { role?: string }).role = token.role as string | undefined;
                    (session.user as { status?: string }).status = token.status as string | undefined;
                    (session.user as { signupPending?: boolean }).signupPending = !!token.signupPending;
                }
                return session;
            },
            async redirect({ url }) {
                // 서버리스에서 모듈 변수가 비어 있을 수 있으므로, 없으면 /api/auth/success로 보내서 그쪽에서 학생/학부모 조회 후 리다이렉트
                const toUse = pendingSignInRedirectUrl ?? url ?? "/api/auth/success";
                if (pendingSignInRedirectUrl) pendingSignInRedirectUrl = null;
                return toUse;
            },
        },
        pages: {
            signIn: "/login",
        },
        session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
        secret: process.env.NEXTAUTH_SECRET,
    };
}
