import type { NextConfig } from "next";

// 빌드 시 NEXTAUTH_SECRET 존재 여부 확인 (Vercel 빌드 로그에 출력)
console.log("[next.config] NEXTAUTH_SECRET at build:", process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET");

const nextConfig: NextConfig = {
  /* config options here */
  // 디버그 결과: 런타임에 NEXTAUTH_SECRET 없음 → 빌드 시점에 번들에 인라인.
  // Vercel 빌드 시 process.env에 주입되면 여기서 읽혀 번들에 박힘.
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  },
};

export default nextConfig;
