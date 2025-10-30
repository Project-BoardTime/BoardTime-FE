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
        <div className="flex min-h-screen">
          {/* 1. 왼쪽 브랜딩 영역 (md 이상) */}
          <div
            className="hidden md:flex md:w-1/2 relative items-center justify-center p-10
                          bg-[url('/images/boardgame-bg.jpg')] bg-cover bg-center bg-fixed"
          >
            <div className="absolute inset-0 bg-board-dark opacity-70 z-0"></div>
            <div className="relative z-10 text-center text-board-light">
              <h1 className="text-5xl font-extrabold mb-4">BoardTime</h1>
              <p className="text-xl font-medium leading-relaxed">
                당신의 다음 보드게임 모임,
                <br />
                가장 완벽한 순간을 계획하세요.
              </p>
            </div>
          </div>

          {/* 2. 오른쪽 상호작용 영역 컨테이너 */}
          {/* 전체 배경색(board-dark)과 중앙 정렬 담당 */}
          <div className="w-full md:w-1/2 bg-board-dark flex items-center justify-center p-4">
            {/* --- ⬇️ 카드 스타일 적용 (틀 복원) ⬇️ --- */}
            {/* 이 div가 모바일/데스크톱 모두에서 보이는 '카드 틀' 역할 */}
            {/* <div className="relative z-10 w-full max-w-md mx-auto p-8 bg-board-primary text-board-light rounded-2xl shadow-lg min-h-[600px] flex flex-col justify-center"> */}
            <div className="relative z-10 w-full max-w-sm mx-auto px-8 pt-8 bg-white text-board-dark rounded-2xl shadow-lg max-h-[80vh] overflow-y-auto">
              {children}
            </div>

            {/* --- ⬆️ 카드 스타일 끝 ⬆️ --- */}
          </div>
        </div>
      </body>
    </html>
  );
}
