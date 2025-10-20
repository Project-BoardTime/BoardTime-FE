"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    // <main> 태그 등 레이아웃 구조는 모두 제거합니다.
    <>
      {/* 모임 생성자용 UI */}
      <div className="mb-12">
        <h2 className="text-4xl font-bold mb-8 text-center">BoardTime</h2>
        <Link href="/create" className="w-full">
          <button className="w-full bg-white text-blue-600 font-bold py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
            모임 생성하기
          </button>
        </Link>
      </div>

      {/* 내 모임 찾기 폼 */}
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
    </>
  );
}
