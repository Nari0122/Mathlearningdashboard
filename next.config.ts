import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // NEXTAUTH_SECRET, AUTH_SECRET: 빌드 시 env 전달 (NextAuth NO_SECRET 방지)
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  },
};

export default nextConfig;
