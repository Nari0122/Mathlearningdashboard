import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // NEXTAUTH_SECRET/AUTH_SECRET은 next.config env에 넣지 않음.
  // 빌드 시 undefined면 번들에 undefined가 박혀 런타임 Vercel env를 덮어써 NO_SECRET 발생.
  // getNextAuthSecret()에서 require('process')로 런타임 env 직접 읽음.
};

export default nextConfig;
