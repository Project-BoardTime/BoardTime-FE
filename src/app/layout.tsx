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
        {/* 전체 화면을 flex 컨테이너로 설정 */}
        <div className="flex min-h-screen">
          {/* 1. 왼쪽 브랜딩 영역 (md 사이즈 이상에서만 보임) */}
          <div
            className="hidden md:flex md:w-1/2 relative items-center justify-center p-10
                          bg-[url('/images/boardgame-bg.jpg')] bg-cover bg-center bg-fixed"
          >
            {" "}
            {/* 🎨 배경 이미지 적용 */}
            {/* 배경 이미지 위에 어두운 오버레이 추가 */}
            <div className="absolute inset-0 bg-board-dark opacity-70 z-0"></div>{" "}
            {/* ✨ 오버레이 */}
            {/* 문구 (오버레이 위에 표시) */}
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
          {/* 모바일에서는 전체 너비, 데스크톱에서는 절반 너비 */}
          {/* 배경색은 board-dark로 설정하고, 자식 요소(children)를 중앙에 배치 */}
          <div className="w-full md:w-1/2 bg-board-dark flex items-center justify-center p-4">
            {" "}
            {/* 🎨 배경색 지정 */}
            {/* ⭐️ 실제 페이지 내용({children})이 여기에 렌더링됩니다 ⭐️ */}
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
