"use client";

import Link from "next/link";
import { useState } from "react"; // useState 임포트
import { useRouter } from "next/navigation"; // useRouter 임포트

export default function HomePage() {
  const router = useRouter(); // useRouter 훅 사용
  const [searchTerm, setSearchTerm] = useState(""); // 검색어 상태 관리

  // 검색 폼 제출 핸들러
  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 폼 기본 제출 동작 방지
    if (!searchTerm.trim()) {
      alert("검색어를 입력해주세요.");
      return;
    }

    try {
      // 백엔드 검색 API 호출 (rewrites 경로 사용)
      const response = await fetch(
        `/api/be/meetings/search?title=${encodeURIComponent(searchTerm.trim())}`
      );

      if (!response.ok) {
        throw new Error("모임 검색에 실패했습니다.");
      }

      const results = await response.json();

      if (results.length === 1) {
        // 결과가 하나면 해당 모임 페이지로 이동
        router.push(`/meetings/${results[0]._id}`);
      } else if (results.length > 1) {
        alert(
          "여러 개의 모임이 검색되었습니다. 더 정확한 검색어를 입력해주세요."
        );
        // TODO: 나중에 검색 결과 목록을 보여주는 방식으로 개선 가능
      } else {
        alert("해당하는 모임을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  return (
    // 레이아웃 구조는 이전과 동일
    <>
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
        {/* form에 onSubmit 핸들러 연결 */}
        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          <input
            id="meeting-search"
            type="text"
            placeholder="모임 이름 또는 ID 입력"
            className="flex-grow p-3 rounded-lg text-gray-800"
            value={searchTerm} // input 값과 상태 연결
            onChange={(e) => setSearchTerm(e.target.value)} // 입력 시 상태 업데이트
            required // 필수 입력 필드
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
