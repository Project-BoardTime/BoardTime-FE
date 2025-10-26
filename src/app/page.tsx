"use client";

import Link from "next/link";
// Fragment는 여러 요소를 감싸는 부모 태그 없이 그룹화할 때 사용합니다.
import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";

// 검색 결과 타입 정의
interface SearchResult {
  _id: string;
  title: string;
}

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // --- ⬇️ 모달 관련 상태 추가 ⬇️ ---
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 열림/닫힘 상태
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null
  ); // 사용자가 클릭한 모임 ID
  const [passwordInput, setPasswordInput] = useState(""); // 모달 안의 비밀번호 입력값
  const [isAuthenticating, setIsAuthenticating] = useState(false); // 인증 API 호출 중 상태
  const [authError, setAuthError] = useState<string | null>(null); // 인증 에러 메시지
  // --- ⬆️ 모달 관련 상태 끝 ⬆️ ---

  // 검색 폼 제출 핸들러
  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchMessage("검색어를 입력해주세요.");
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchMessage(null);
    setSearchResults([]);

    try {
      const response = await fetch(
        `/api/be/meetings/search?title=${encodeURIComponent(searchTerm.trim())}`
      );
      if (!response.ok) throw new Error("모임 검색 실패");
      const results: SearchResult[] = await response.json();

      if (results.length === 1) {
        // --- ⬇️ 결과가 하나면 바로 인증 모달 열기 ⬇️ ---
        handleOpenModal(results[0]._id);
        setSearchMessage("모임을 찾았습니다. 비밀번호를 입력하세요."); // 메시지 변경
        // --- ⬆️ 변경된 부분 ⬆️ ---
      } else if (results.length > 1) {
        setSearchResults(results);
        setSearchMessage(`${results.length}개의 모임 검색됨. 선택하세요.`);
      } else {
        setSearchMessage("해당 모임을 찾을 수 없음.");
      }
    } catch (error) {
      console.error(error);
      setSearchMessage("검색 중 오류 발생");
    } finally {
      setIsSearching(false);
    }
  };

  // --- ⬇️ 모달 열기 함수 ⬇️ ---
  const handleOpenModal = (meetingId: string) => {
    setSelectedMeetingId(meetingId); // 클릭된 모임 ID 저장
    setPasswordInput(""); // 비밀번호 입력창 초기화
    setAuthError(null); // 에러 메시지 초기화
    setIsModalOpen(true); // 모달 상태를 true로 변경하여 화면에 표시
  };

  // --- ⬇️ 모달 닫기 함수 ⬇️ ---
  const handleCloseModal = () => {
    setIsModalOpen(false); // 모달 상태를 false로 변경하여 숨김
    setSelectedMeetingId(null); // 선택된 ID 초기화 (선택 사항)
  };

  // --- ⬇️ 모달 비밀번호 제출 핸들러 ⬇️ ---
  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 기본 폼 제출 방지
    if (!selectedMeetingId) return; // 선택된 모임 ID 없으면 중단

    setIsAuthenticating(true); // 인증 시작 상태
    setAuthError(null); // 에러 초기화

    try {
      // 백엔드 인증 API 호출 (/api/be/ 사용)
      const response = await fetch(
        `/api/be/meetings/${selectedMeetingId}/auth`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passwordInput }), // 입력된 비밀번호 전송
        }
      );

      // 응답 상태 확인
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("비밀번호가 일치하지 않습니다.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "인증 중 오류가 발생했습니다.");
      }

      // --- 인증 성공 ---
      handleCloseModal(); // 모달 닫기
      // TODO: '/manage' 경로는 아직 없으므로, 일단 상세 페이지로 이동하도록 설정
      // 나중에 관리 페이지 구현 후 경로 수정 필요
      router.push(`/meetings/${selectedMeetingId}`);
      // router.push(`/meetings/${selectedMeetingId}/manage`);
    } catch (error: unknown) {
      // --- 인증 실패 ---
      setAuthError(error instanceof Error ? error.message : "알 수 없는 오류");
    } finally {
      setIsAuthenticating(false); // 인증 종료 상태
    }
  };

  return (
    // Fragment로 감싸서 여러 요소를 반환
    <Fragment>
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
        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          {/* ... (input, button UI는 이전과 동일) ... */}
          <input
            id="meeting-search"
            type="text"
            placeholder="모임 이름 또는 ID 입력"
            className="flex-grow p-3 rounded-lg text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            required
            disabled={isSearching}
          />
          <button
            type="submit"
            className={`font-bold py-3 px-5 rounded-lg transition-colors duration-300 ${
              isSearching
                ? "bg-gray-500 text-gray-400 cursor-not-allowed"
                : "bg-blue-800 hover:bg-blue-900 text-white"
            }`}
            disabled={isSearching}
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

        {/* --- ⬇️ 검색 결과 목록 (클릭 시 handleOpenModal 호출) ⬇️ --- */}
        {searchResults.length > 1 && (
          <div className="mt-6 w-full border-t border-blue-500 pt-4">
            <ul className="space-y-2 max-h-32 overflow-y-auto">
              {searchResults.map((meeting) => (
                <li
                  key={meeting._id}
                  className="bg-blue-700 p-2 rounded hover:bg-blue-800"
                >
                  {/* Link 대신 button 사용 */}
                  <button
                    onClick={() => handleOpenModal(meeting._id)} // 클릭 시 모달 열기
                    className="text-white text-sm cursor-pointer block w-full text-left"
                  >
                    {meeting.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* --- ⬆️ 검색 결과 목록 끝 ⬆️ --- */}
      </div>

      {/* --- ⬇️ 인증 모달 UI (isModalOpen 상태에 따라 조건부 렌더링) ⬇️ --- */}
      {isModalOpen && (
        // 모달 배경 (어둡게 처리)
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4"
          onClick={handleCloseModal} // 배경 클릭 시 모달 닫기
        >
          {/* 모달 컨텐츠 (이벤트 버블링 방지) */}
          <div
            className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-xs relative text-gray-800"
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않게 함
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="닫기"
            >
              &times; {/* 'X' 모양 */}
            </button>

            <h3 className="text-lg font-semibold mb-4 text-center">
              비밀번호 확인
            </h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              모임을 관리하려면
              <br />
              생성 시 설정한 비밀번호를 입력하세요.
            </p>
            {/* 비밀번호 입력 폼 */}
            <form onSubmit={handleAuthSubmit}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호 입력"
                disabled={isAuthenticating} // 인증 중 비활성화
              />
              {/* 에러 메시지 표시 */}
              {authError && (
                <p className="text-red-500 text-xs text-center mb-4">
                  {authError}
                </p>
              )}
              {/* 확인 버튼 */}
              <button
                type="submit"
                className={`w-full font-bold py-2 px-4 rounded transition-colors duration-300 ${
                  isAuthenticating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                disabled={isAuthenticating} // 인증 중 비활성화
              >
                {isAuthenticating ? "확인 중..." : "확인"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* --- ⬆️ 모달 UI 끝 ⬆️ --- */}
    </Fragment>
  );
}
