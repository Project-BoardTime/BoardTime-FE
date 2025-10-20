import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BoardTime",
  description: "가장 쉬운 일정 조율",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* 전체 배경 (빨간색) */}
        <main className="flex min-h-screen w-full items-center justify-center bg-red-500 p-4">
          {/* 데스크톱용 레이아웃 컨테이너 */}
          <div className="flex w-full max-w-5xl">
            {/* 왼쪽 빈 공간 (데스크톱에서만 보임) */}
            <div className="hidden md:block md:w-1/2"></div>

            {/* 오른쪽 상호작용 영역 (파란색 카드) */}
            <div className="w-full md:w-1/2">
              <div className="w-full max-w-sm bg-blue-600 text-white rounded-2xl shadow-lg p-8 flex flex-col justify-center min-h-[600px]">
                {/* ⭐️ 실제 페이지 내용이 여기에 렌더링됩니다 ⭐️ */}
                {children}
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
