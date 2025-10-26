"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

// 검색 결과 항목의 타입을 정의 (API 응답에 맞춰 조정 필요)
interface SearchResult {
  _id: string;
  title: string;
  // 필요하다면 생성일자 등 추가 정보 포함
}

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); // 검색 결과 목록 상태
  const [searchMessage, setSearchMessage] = useState<string | null>(null); // 검색 결과 메시지 상태
  const [isSearching, setIsSearching] = useState(false); // 검색 중 상태

  // 검색 폼 제출 핸들러
  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchMessage("검색어를 입력해주세요.");
      setSearchResults([]); // 이전 결과 초기화
      return;
    }

    setIsSearching(true); // 검색 시작
    setSearchMessage(null); // 이전 메시지 초기화
    setSearchResults([]); // 이전 결과 초기화

    try {
      const response = await fetch(
        `/api/be/meetings/search?title=${encodeURIComponent(searchTerm.trim())}`
      );

      if (!response.ok) {
        throw new Error("모임 검색에 실패했습니다.");
      }

      const results: SearchResult[] = await response.json();

      if (results.length === 1) {
        // 결과가 하나면 바로 인증 페이지로 이동
        router.push(`/meetings/${results[0]._id}/auth`);
      } else if (results.length > 1) {
        // 결과가 여러 개면 목록 상태에 저장
        setSearchResults(results);
        setSearchMessage(
          `${results.length}개의 모임이 검색되었습니다. 관리할 모임을 선택하세요.`
        );
      } else {
        // 결과가 없으면 메시지 표시
        setSearchMessage("해당하는 모임을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error(error);
      setSearchMessage("검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false); // 검색 종료
    }
  };

  return (
    <>
      {/* 모임 생성자용 UI (변경 없음) */}
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
        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          <input
            id="meeting-search"
            type="text"
            placeholder="모임 이름 또는 ID 입력"
            className="flex-grow p-3 rounded-lg text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            required
            disabled={isSearching} // 검색 중 입력 비활성화
          />
          <button
            type="submit"
            className={`font-bold py-3 px-5 rounded-lg transition-colors duration-300 ${
              isSearching
                ? "bg-gray-500 text-gray-400 cursor-not-allowed"
                : "bg-blue-800 hover:bg-blue-900 text-white"
            }`}
            disabled={isSearching} // 검색 중 버튼 비활성화
          >
            {isSearching ? "검색중..." : "찾기"}
          </button>
        </form>

        {/* 검색 결과 메시지 */}
        {searchMessage && (
          <p className="text-center text-sm mt-4 text-blue-200">
            {searchMessage}
          </p>
        )}

        {/* 검색 결과 목록 (결과가 여러 개일 때만 표시) */}
        {searchResults.length > 1 && (
          <div className="mt-6 w-full border-t border-blue-500 pt-4">
            <ul className="space-y-2 max-h-32 overflow-y-auto">
              {searchResults.map((meeting) => (
                <li
                  key={meeting._id}
                  className="bg-blue-700 p-2 rounded hover:bg-blue-800"
                >
                  <Link href={`/meetings/${meeting._id}/auth`}>
                    <span className="text-white text-sm cursor-pointer block">
                      {meeting.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
