import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import type { AuthOptions } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { AUTH_SIGNUP_ROLE_COOKIE } from "@/lib/auth-constants";

type NextAuthContext = { params: { nextauth: string[] } };

export async function GET(
    request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> }
) {
    let signupRole = request.cookies.get(AUTH_SIGNUP_ROLE_COOKIE)?.value;
    const isCallback = request.nextUrl.pathname.includes("/callback/");
    if (isCallback && !signupRole) signupRole = "STUDENT";

    const options: AuthOptions = getAuthOptions(signupRole);
    const p = await context.params;
    const nextAuthContext: NextAuthContext = {
        params: { nextauth: (p.nextauth as string[]) ?? [] },
    };
    return NextAuth(request, nextAuthContext, options);
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> }
) {
    let signupRole = request.cookies.get(AUTH_SIGNUP_ROLE_COOKIE)?.value;
    const isCallback = request.nextUrl.pathname.includes("/callback/");
    if (isCallback && !signupRole) signupRole = "STUDENT";

    const options: AuthOptions = getAuthOptions(signupRole);
    const p = await context.params;
    const nextAuthContext: NextAuthContext = {
        params: { nextauth: (p.nextauth as string[]) ?? [] },
    };
    return NextAuth(request, nextAuthContext, options);
}
