import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import { AUTH_SIGNUP_ROLE_COOKIE, AUTH_ADMIN_LOGIN_FLOW_COOKIE, getHomePathByRole } from "./auth-constants";
import { verifyKakaoIdToken } from "./verify-kakao-id-token";
import { studentService } from "@/services/studentService";
import { parentService } from "@/services/parentService";
import { userService } from "@/services/userService";

export { AUTH_SIGNUP_ROLE_COOKIE, AUTH_ADMIN_LOGIN_FLOW_COOKIE, getHomePathByRole, getNextAuthSecret };

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

export type AuthContext = { adminLoginFlow?: boolean; adminSignupIntent?: boolean };

/** 런타임(요청 시점)에 env 읽기 - 빌드 시 인라인으로 비어버리는 것 방지 */
function getKakaoCredentials() {
    const id = process.env.KAKAO_CLIENT_ID?.trim() ?? "";
    const secret = process.env.KAKAO_CLIENT_SECRET?.trim() ?? "";
    return { id, secret };
}

export function getAuthOptions(signupRoleCookie?: string, context?: AuthContext): NextAuthOptions {
    const adminLoginFlow = context?.adminLoginFlow ?? false;
    const adminSignupIntent = context?.adminSignupIntent ?? false;
    const { id: kakaoId, secret: kakaoSecret } = getKakaoCredentials();

    const providers: NextAuthOptions["providers"] = [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
    ];

    // 카카오: clientId 없으면 프로바이더 제외 (client_id is required 오류 방지)
    if (kakaoId && kakaoSecret) {
        providers.push(
            KakaoProvider({
                clientId: kakaoId,
                clientSecret: kakaoSecret,
                authorization: {
                    params: {
                        scope: "profile_nickname profile_image",
                        prompt: "login",
                    },
                },
            })
        );
    }

    providers.push(
        NaverProvider({
            clientId: process.env.NAVER_CLIENT_ID ?? "",
            clientSecret: process.env.NAVER_CLIENT_SECRET ?? "",
        })
    );

    return {
        providers,
        callbacks: {
            async signIn({ user, account }) {
                try {
                    if (!account) return false;
                    const uid = String(account.providerAccountId ?? user.id ?? "");
                    if (!uid) return false;

                    if (account.provider === "kakao" && adminLoginFlow) {
                        pendingSignInRedirectUrl = adminSignupIntent
                            ? "/admin-login/callback?intent=signup"
                            : "/admin-login/callback";
                        return true;
                    }

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
                            const accountStatus = (existingStudent as { accountStatus?: string }).accountStatus ?? "ACTIVE";
                            if (accountStatus === "INACTIVE") {
                                pendingSignInRedirectUrl = "/login?error=account_inactive";
                                return true;
                            }
                            const status = (existingStudent as { approvalStatus?: string }).approvalStatus;
                            if (status === "PENDING") {
                                pendingSignInRedirectUrl = "/pending-approval";
                            } else {
                                pendingSignInRedirectUrl = `/student/${existingStudent.id}`;
                            }
                            return true;
                        }
                        // 로그인 페이지에서 카카오 로그인 시 학부모 문서 있으면 학부모 대시보드로 (URL에 uid 포함)
                        const existingParent = await parentService.getParentByUid(uid);
                        if (existingParent) {
                            pendingSignInRedirectUrl = `/parent/${uid}/dashboard`;
                            return true;
                        }
                        const existingAdmin = await userService.getAdmin(uid);
                        const adminRole = existingAdmin && (existingAdmin as { role?: string }).role;
                        if (adminRole === "ADMIN" || adminRole === "SUPER_ADMIN") {
                            pendingSignInRedirectUrl = "/auth/admin-login-required";
                            return true;
                        }
                        pendingSignInRedirectUrl = "/signup";
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
                if (uid) safeToken.uid = safeToken.uid ?? uid;
                const u = user as unknown as { role?: string; status?: string } | null;
                if (u?.role) {
                    safeToken.role = u.role;
                    safeToken.status = u.status;
                    safeToken.signupPending = false;
                }
                // JWT에 role이 없으면 DB에서 관리자 여부 확인 (middleware는 JWT만 참조하므로 여기서 설정 필요)
                if (!safeToken.role && uid) {
                    const dbUser = await userService.getAdmin(uid);
                    const r = dbUser && (dbUser as { role?: string }).role;
                    if (r === "ADMIN" || r === "SUPER_ADMIN") {
                        safeToken.role = r;
                        safeToken.status = (dbUser as { status?: string }).status;
                        safeToken.signupPending = false;
                    } else {
                        safeToken.signupPending = true;
                    }
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
                    if (!token.role && token.uid) {
                        const dbUser = await userService.getAdmin(String(token.uid));
                        const r = dbUser && (dbUser as { role?: string }).role;
                        if (r === "ADMIN" || r === "SUPER_ADMIN") {
                            (session.user as { role?: string }).role = r;
                            (session.user as { status?: string }).status = (dbUser as { status?: string }).status;
                        }
                    }
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
            error: "/auth/error",
        },
        session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
        secret: getNextAuthSecret(),
    };
}

/**
 * next.config env로 빌드 시 인라인됨. (Vercel 런타임엔 env 미주입 확인됨)
 */
function getNextAuthSecret(): string | undefined {
    const v = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
