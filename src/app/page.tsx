"use client";

import Link from "next/link";
import { useState, Fragment } from "react"; // Fragment 임포트
import { useRouter } from "next/navigation";

// 검색 결과 타입 정의
interface SearchResult {
  _id: string;
  title: string;
}

export default function HomePage() {
  const router = useRouter(); // 페이지 이동을 위한 훅
  const [searchTerm, setSearchTerm] = useState(""); // 검색어 상태
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); // 검색 결과 목록 상태
  const [searchMessage, setSearchMessage] = useState<string | null>(null); // 검색 결과 관련 메시지 상태
  const [isSearching, setIsSearching] = useState(false); // 검색 API 호출 중 상태

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 열림/닫힘
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null
  ); // 선택된 모임 ID
  const [passwordInput, setPasswordInput] = useState(""); // 모달 내 비밀번호 입력값
  const [isAuthenticating, setIsAuthenticating] = useState(false); // 인증 API 호출 중 상태
  const [authError, setAuthError] = useState<string | null>(null); // 인증 에러 메시지

  // 검색 폼 제출 시 실행될 함수
  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 기본 이벤트 방지
    // 검색어 유효성 검사
    if (!searchTerm.trim()) {
      setSearchMessage("검색어를 입력해주세요.");
      setSearchResults([]);
      return;
    }
    // 상태 초기화 및 검색 시작
    setIsSearching(true);
    setSearchMessage(null);
    setSearchResults([]);

    try {
      // 백엔드 검색 API 호출 (rewrites 경로 사용)
      const response = await fetch(
        `/api/be/meetings/search?title=${encodeURIComponent(searchTerm.trim())}`
      );
      if (!response.ok) {
        throw new Error("모임 검색에 실패했습니다.");
      }
      const results: SearchResult[] = await response.json(); // 결과 파싱

      // 검색 결과에 따른 분기 처리
      if (results.length === 1) {
        // 결과가 하나면 바로 인증 모달 열기
        handleOpenModal(results[0]._id);
        setSearchMessage("모임을 찾았습니다. 비밀번호를 입력하세요.");
      } else if (results.length > 1) {
        // 결과가 여러 개면 목록 표시
        setSearchResults(results);
        setSearchMessage(
          `${results.length}개의 모임이 검색되었습니다. 관리할 모임을 선택하세요.`
        );
      } else {
        // 결과가 없으면 메시지 표시
        setSearchMessage("해당하는 모임을 찾을 수 없습니다.");
      }
    } catch (error) {
      // 에러 처리
      console.error(error);
      setSearchMessage("검색 중 오류가 발생했습니다.");
    } finally {
      // 검색 종료 상태 업데이트
      setIsSearching(false);
    }
  };

  // 모달 열기 함수
  const handleOpenModal = (meetingId: string) => {
    setSelectedMeetingId(meetingId); // 선택된 모임 ID 저장
    setPasswordInput(""); // 입력 필드 초기화
    setAuthError(null); // 에러 메시지 초기화
    setIsModalOpen(true); // 모달 열기 상태로 변경
  };

  // 모달 닫기 함수
  const handleCloseModal = () => {
    setIsModalOpen(false); // 모달 닫기 상태로 변경
    setSelectedMeetingId(null); // 선택된 ID 초기화 (선택 사항)
  };

  // 모달 내 비밀번호 확인 폼 제출 함수
  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 기본 이벤트 방지
    if (!selectedMeetingId) return; // 선택된 ID 없으면 종료

    setIsAuthenticating(true); // 인증 시작 상태
    setAuthError(null); // 에러 초기화

    try {
      // 백엔드 인증 API 호출
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

      // 인증 성공 시 처리
      handleCloseModal(); // 모달 닫기
      // 관리 페이지로 이동
      router.push(`/meetings/${selectedMeetingId}/manage`);
    } catch (error: unknown) {
      // 인증 실패 시 처리
      setAuthError(error instanceof Error ? error.message : "알 수 없는 오류");
    } finally {
      // 인증 종료 상태 업데이트
      setIsAuthenticating(false);
    }
  };

  // JSX 렌더링 시작
  return (
    // Fragment 사용: page.tsx는 layout.tsx의 children이므로 최상위 태그 불필요
    <Fragment>
      {/* 파란색 카드 UI 시작 (layout.tsx 안쪽 컨텐츠) */}
      <div className="relative z-10 w-full max-w-md mx-auto p-8 bg-board-primary text-board-light rounded-2xl shadow-lg">
        {/* 모임 생성 버튼 영역 */}
        <div className="mb-12">
          <Link href="/create" className="w-full block">
            <button className="w-full bg-board-light text-board-dark font-bold py-3 px-4 rounded-lg hover:bg-board-secondary transition-colors duration-300">
              새로운 모임 생성하기
            </button>
          </Link>
        </div>

        {/* 내 모임 찾기 폼 영역 */}
        <div className="w-full">
          {/* 라벨 */}
          <label
            htmlFor="meeting-search"
            className="block text-sm font-medium mb-2 text-board-light"
          >
            내 모임 찾기
          </label>
          {/* 검색 폼 */}
          <form onSubmit={handleSearchSubmit} className="flex space-x-2">
            {/* 검색어 입력창 */}
            <input
              id="meeting-search"
              type="text"
              placeholder="모임 이름 또는 ID 입력"
              className="flex-grow p-3 rounded-lg text-board-dark border border-board-secondary focus:ring-2 focus:ring-board-accent-gold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              required
              disabled={isSearching} // 검색 중 비활성화
            />
            {/* 찾기 버튼 */}
            <button
              type="submit"
              className={`font-bold py-3 px-5 rounded-lg transition-colors duration-300 ${
                isSearching
                  ? "bg-board-secondary text-board-light cursor-not-allowed" // 비활성화 스타일
                  : "bg-board-accent-green hover:bg-board-accent-green/80 text-board-dark" // 활성화 스타일
              }`}
              disabled={isSearching} // 검색 중 비활성화
            >
              {isSearching ? "검색중..." : "찾기"}
            </button>
          </form>

          {/* 검색 결과 안내 메시지 */}
          {searchMessage && (
            <p className="text-center text-sm mt-4 text-board-light">
              {searchMessage}
            </p>
          )}

          {/* 검색 결과 목록 (결과가 여러 개일 때만 표시) */}
          {searchResults.length > 1 && (
            <div className="mt-6 w-full border-t border-board-secondary pt-4">
              {" "}
              {/* 구분선 */}
              <ul className="space-y-2 max-h-32 overflow-y-auto">
                {" "}
                {/* 스크롤 가능한 목록 */}
                {searchResults.map((meeting) => (
                  // 각 모임 항목
                  <li
                    key={meeting._id}
                    className="bg-board-secondary p-2 rounded hover:bg-board-secondary/80"
                  >
                    {/* 모임 제목 버튼 (클릭 시 모달 열기) */}
                    <button
                      onClick={() => handleOpenModal(meeting._id)}
                      className="text-board-light text-sm cursor-pointer block w-full text-left"
                    >
                      {meeting.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {/* 파란색 카드 UI 끝 */}

      {/* --- 인증 모달 UI (isModalOpen 상태에 따라 조건부 렌더링) --- */}
      {isModalOpen && (
        // 모달 배경 (어둡게 처리)
        <div
          className="fixed inset-0 bg-board-dark/70 flex items-center justify-center z-40 p-4"
          onClick={handleCloseModal} // 배경 클릭 시 모달 닫기
        >
          {/* 모달 창 (컨텐츠) */}
          <div
            className="bg-board-light p-6 rounded-lg shadow-xl z-50 w-full max-w-xs relative text-board-dark"
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록 이벤트 전파 중지
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-3 text-board-dark/60 hover:text-board-dark text-2xl font-bold"
              aria-label="닫기"
            >
              &times; {/* 'X' 아이콘 */}
            </button>

            {/* 모달 제목 */}
            <h3 className="text-lg font-semibold mb-4 text-center">
              비밀번호 확인
            </h3>
            {/* 안내 문구 */}
            <p className="text-sm text-board-dark/80 mb-4 text-center">
              모임을 관리하려면
              <br />
              생성 시 설정한 비밀번호를 입력하세요.
            </p>
            {/* 비밀번호 입력 폼 */}
            <form onSubmit={handleAuthSubmit}>
              {/* 비밀번호 입력 필드 */}
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full p-2 border border-board-secondary rounded mb-4 focus:ring-2 focus:ring-board-accent-gold text-board-dark"
                placeholder="비밀번호 입력"
                disabled={isAuthenticating} // 인증 중 비활성화
              />
              {/* 인증 에러 메시지 표시 */}
              {authError && (
                <p className="text-red-600 text-xs text-center mb-4">
                  {authError}
                </p>
              )}
              {/* 확인 버튼 */}
              <button
                type="submit"
                className={`w-full font-bold py-2 px-4 rounded transition-colors duration-300 ${
                  isAuthenticating
                    ? "bg-board-secondary/50 cursor-not-allowed text-board-dark/80" // 비활성화 스타일
                    : "bg-board-accent-green hover:bg-board-accent-green/80 text-board-dark" // 활성화 스타일
                }`}
                disabled={isAuthenticating} // 인증 중 비활성화
              >
                {isAuthenticating ? "확인 중..." : "확인"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* --- 모달 UI 끝 --- */}
    </Fragment> // Fragment 끝
  );
} // HomePage 컴포넌트 끝
