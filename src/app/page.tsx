"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    // 1. 전체 배경 (빨간색)
    <main className="flex min-h-screen w-full items-center justify-center bg-red-500 p-4">
      {/* 2. 데스크톱용 레이아웃 컨테이너 */}
      {/* - 모바일에서는 일반 컨테이너 역할
        - 데스크톱(md 이상)에서는 flex 컨테이너로 작동하여 두 영역을 나란히 배치 */}
      <div className="flex w-full max-w-5xl">
        {/* 2-1. 왼쪽 빈 공간 (데스크톱에서만 보임) */}
        {/* - 데스크톱에서 너비의 1/2을 차지하여 오른쪽 영역을 밀어내는 역할 */}
        <div className="hidden md:block md:w-1/2"></div>

        {/* 2-2. 오른쪽 상호작용 영역 */}
        {/* - 모바일에서는 전체 너비를, 데스크톱에서는 너비의 1/2을 차지 */}
        <div className="w-full md:w-1/2">
          {/* 파란색 카드 (내용은 이전과 동일) */}
          <div className="w-full max-w-sm bg-blue-600 text-white rounded-2xl shadow-lg p-8 flex flex-col justify-center min-h-[600px]">
            <div className="mb-12">
              <h2 className="text-4xl font-bold mb-8 text-center">BoardTime</h2>
              <Link href="/create" className="w-full">
                <button className="w-full bg-white text-blue-600 font-bold py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  모임 생성하기
                </button>
              </Link>
            </div>
            <div className="w-full">
              <label
                htmlFor="meeting-search"
                className="block text-sm font-medium mb-2"
              >
                내 모임 찾기
              </label>
              <form className="flex space-x-2">
                <input
                  id="meeting-search"
                  type="text"
                  placeholder="모임 이름 또는 ID 입력"
                  className="flex-grow p-3 rounded-lg text-gray-800"
                />
                <button
                  type="submit"
                  className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-5 rounded-lg transition-colors duration-300"
                >
                  찾기
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
