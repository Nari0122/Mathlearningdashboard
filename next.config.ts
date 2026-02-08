import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // NEXTAUTH_SECRET: Vercel 빌드 시 env에서 읽어서 주입 (런타임 undefined 방지)
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

export default nextConfig;
