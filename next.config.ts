// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 여기에 rewrites 함수 추가
  async rewrites() {
    return [
      {
        // 프론트엔드에서 /api/be/ 로 시작하는 모든 요청은...
        source: "/api/be/:path*",
        // ...실제 백엔드 API 주소로 전달됩니다.
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`, // 환경 변수 사용
      },
      // 필요하면 여기에 다른 rewrite 규칙 추가
    ];
  },
  // 기존에 있던 다른 설정들은 유지 (예: reactStrictMode)
  reactStrictMode: true, // 예시, 기존 설정 유지
};

export default nextConfig;
