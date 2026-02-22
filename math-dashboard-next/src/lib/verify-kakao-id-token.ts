/**
 * 카카오 ID 토큰 JWT 서명 검증 (RFC 7516 / 카카오 개발자 가이드)
 * - ID 토큰은 제3자(카카오 인증 서버)에서 발급하므로 서명 검증 후 사용해야 함.
 */

import JwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";

const KAKAO_JWKS_URI = "https://kauth.kakao.com/.well-known/jwks.json";
const KAKAO_ISSUER = "https://kauth.kakao.com";

let jwksClient: JwksClient.JwksClient | null = null;

function getJwksClient(): JwksClient.JwksClient {
    if (!jwksClient) {
        jwksClient = JwksClient({
            jwksUri: KAKAO_JWKS_URI,
            cache: true,
            cacheMaxAge: 7 * 24 * 60 * 60 * 1000, // 7일
            cacheMaxEntries: 10,
        });
    }
    return jwksClient;
}

async function getPublicKey(kid: string): Promise<string | null> {
    return new Promise((resolve) => {
        getJwksClient().getSigningKey(kid, (err, key) => {
            if (err || !key) {
                resolve(null);
                return;
            }
            const pub = key.getPublicKey();
            resolve(pub ?? null);
        });
    });
}

export type KakaoIdTokenPayload = {
    sub: string;
    iss?: string;
    aud?: string;
    exp?: number;
    iat?: number;
};

/**
 * 카카오 ID 토큰을 JWKS로 검증하고 payload 반환. 실패 시 null.
 */
export async function verifyKakaoIdToken(idToken: string): Promise<KakaoIdTokenPayload | null> {
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || typeof decoded !== "object" || !("header" in decoded) || !decoded.header?.kid) {
        return null;
    }
    const key = await getPublicKey(decoded.header.kid);
    if (!key) return null;
    try {
        const payload = jwt.verify(idToken, key, {
            algorithms: ["RS256"],
            issuer: KAKAO_ISSUER,
        });
        return typeof payload === "object" && payload !== null && "sub" in payload
            ? (payload as KakaoIdTokenPayload)
            : null;
    } catch {
        return null;
    }
}
