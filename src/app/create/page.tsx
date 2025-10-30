"use client";

import Link from "next/link";
import { useState, Fragment, useRef } from "react"; // Fragment는 이제 불필요할 수 있으나 유지
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker"; // DatePicker 임포트
import "react-datepicker/dist/react-datepicker.css"; // DatePicker CSS 임포트
import { ko } from "date-fns/locale"; // 한국어 로케일 임포트

export default function CreateMeetingPage() {
  const router = useRouter(); // 페이지 이동 훅
  const formRef = useRef<HTMLFormElement>(null); // form 태그를 참조할 ref 생성
  // 폼 입력값 상태 (날짜 옵션 텍스트는 제거)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    password: "",
    deadline: "",
  });
  // DatePicker가 현재 선택하고 있는 값을 저장할 상태
  const [currentDateSelection, setCurrentDateSelection] = useState<Date | null>(
    null
  );
  // 선택된 날짜 객체들을 저장할 배열 상태
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  // API 제출 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 에러 메시지 상태
  const [error, setError] = useState<string | null>(null);
  // 모임 생성 성공 후 ID 저장 상태
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);
  // 링크 복사 성공 피드백 상태
  const [copySuccess, setCopySuccess] = useState(false);

  // 일반 입력 필드 변경 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // DatePicker에서 날짜/시간 선택 후 '추가' 버튼 클릭 시 실행될 함수
  const handleAddDate = () => {
    // 현재 DatePicker에 유효한 날짜가 선택되어 있고,
    // 이미 selectedDates 배열에 동일한 시간의 날짜가 없는 경우에만 추가
    if (
      currentDateSelection &&
      !selectedDates.some((d) => d.getTime() === currentDateSelection.getTime())
    ) {
      // 이전 상태 배열(...prev)에 새 날짜(currentDateSelection)를 추가하고, 시간 순서대로 정렬하여 상태 업데이트
      setSelectedDates((prev) =>
        [...prev, currentDateSelection].sort(
          (a, b) => a.getTime() - b.getTime()
        )
      );
    } else if (currentDateSelection) {
      // 이미 선택된 시간이면 사용자에게 알림
      alert("이미 선택된 시간입니다.");
    }
  };

  // 선택된 날짜 칩의 'x' 버튼 클릭 시 실행될 함수
  const handleRemoveDate = (dateToRemove: Date) => {
    // filter 함수를 사용해 제거할 날짜(시간까지 동일한)를 제외한 새 배열을 만들어 상태 업데이트
    setSelectedDates((prev) =>
      prev.filter((date) => date.getTime() !== dateToRemove.getTime())
    );
  };

  // '모임 만들기' 폼 제출 시 실행될 함수
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 기본 폼 제출 방지
    setIsSubmitting(true); // 제출 시작 상태로 변경
    setError(null); // 에러 메시지 초기화
    setCreatedMeetingId(null); // 이전 성공 ID 초기화

    // 날짜 옵션 유효성 검사 (선택된 날짜가 1개 이상인지)
    if (selectedDates.length === 0) {
      setError("날짜 옵션을 하나 이상 추가해주세요.");
      setIsSubmitting(false); // 제출 종료
      return; // 함수 중단
    }

    try {
      // 백엔드 API 호출 (rewrites 경로 사용)
      const response = await fetch(`/api/be/meetings`, {
        method: "POST", // HTTP POST 메서드
        headers: { "Content-Type": "application/json" }, // 요청 본문 타입 명시
        // 요청 본문 데이터 (상태값을 JSON 문자열로 변환)
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          password: formData.password,
          deadline: formData.deadline,
          // 선택된 Date 객체 배열을 ISO 8601 문자열 배열로 변환하여 전송
          dateOptions: selectedDates.map((date) => date.toISOString()),
        }),
      });

      // 응답 상태 확인
      if (!response.ok) {
        // 에러 응답 처리 (백엔드 에러 메시지 파싱 시도)
        const errorData = await response
          .json()
          .catch(() => ({ error: "모임 생성 중 오류 발생" }));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      // 성공 응답 처리
      const result = await response.json();
      setCreatedMeetingId(result.meetingId); // 생성된 모임 ID 상태에 저장 (-> UI가 링크 공유 화면으로 바뀜)
    } catch (err: unknown) {
      // try 블록 내 에러 처리
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      // 성공/실패 여부와 관계없이 제출 상태 종료
      setIsSubmitting(false);
    }
  };

  // 링크 복사 버튼 클릭 시 실행될 함수
  const handleCopyLink = () => {
    if (!createdMeetingId) return; // 생성된 ID 없으면 중단
    // 현재 웹사이트 주소(origin) + 모임 경로 + ID 조합
    const shareableLink = `${window.location.origin}/meetings/${createdMeetingId}`;
    // 브라우저 클립보드 API 사용하여 링크 복사
    navigator.clipboard
      .writeText(shareableLink)
      .then(() => {
        setCopySuccess(true); // 복사 성공 상태 업데이트
        setTimeout(() => setCopySuccess(false), 2000); // 2초 후 성공 메시지 숨김
      })
      .catch((err) => {
        // 복사 실패 시 에러 처리
        console.error("링크 복사 실패:", err);
        alert("링크 복사에 실패했습니다. 직접 복사해주세요.");
      });
  };

  // --- 렌더링 로직 ---

  // 1. 모임 생성이 완료된 경우 (createdMeetingId 상태에 값이 있을 때)
  if (createdMeetingId) {
    const shareableLink = `${window.location.origin}/meetings/${createdMeetingId}`;
    return (
      <div className="text-center text-board-dark">
        <h2 className="text-2xl font-bold mb-4">🎉 모임 생성 완료! 🎉</h2>
        <p className="mb-6 text-board-dark/80">
          아래 링크를 참여자들에게 공유하세요.
        </p>
        {/* 링크 표시 영역 */}
        <div className="mb-4 bg-board-light border border-board-secondary p-2 rounded shadow-sm">
          <input
            type="text"
            value={shareableLink}
            readOnly
            className="w-full p-1 bg-transparent text-board-dark text-sm text-center outline-none border-none"
            onClick={(e) => e.currentTarget.select()} // 클릭 시 전체 선택
          />
        </div>
        {/* 링크 복사 버튼 */}
        <button
          onClick={handleCopyLink}
          className="w-full bg-board-secondary text-board-light font-bold py-2 px-4 rounded-lg hover:bg-board-primary transition-colors duration-300 mb-2 shadow-sm"
        >
          {copySuccess ? "✅ 복사 완료!" : "🔗 링크 복사하기"}
        </button>
        {/* 생성된 모임 확인 링크 */}
        <Link href={`/meetings/${createdMeetingId}`}>
          <span className="text-sm text-board-secondary hover:underline cursor-pointer">
            생성된 모임 확인하기 &rarr;
          </span>
        </Link>
      </div>
    );
  }

  // 2. 모임 생성 전 또는 실패 시 (폼 UI 렌더링)
  return (
    // 최상위 div에 flex-col과 h-full 추가하여 고정 버튼 레이아웃 지원
    <div className="flex flex-col">
      <h2 className="text-3xl font-bold mb-6 text-center text-board-dark">
        새로운 모임 만들기
      </h2>

      {/* --- 스크롤 가능한 폼 영역 --- */}
      {/* flex-grow: 남은 세로 공간 모두 차지, overflow-y-auto: 내용 넘치면 세로 스크롤 */}
      {/* pr-2: 스크롤바 위한 오른쪽 여백, pb-20: 하단 고정 버튼 위한 아래쪽 여백 */}
      <div className="flex-grow overflow-y-auto pr-2 pt-4 pb-4">
        {/* form 태그는 스크롤 영역 내부에 위치 */}
        {/* handleSubmit은 버튼 onClick에서 처리하므로 form 태그 자체에는 onSubmit 불필요 */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col space-y-4"
        >
          {/* 모임 제목 카드 */}
          <div className="p-4 bg-board-light border border-board-secondary rounded-lg shadow-sm">
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-1 text-board-dark"
            >
              모임 제목
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
              placeholder="예: 프로젝트 회의 일정 조율"
            />
          </div>

          {/* 설명 카드 */}
          <div className="p-4 bg-board-light border border-board-secondary rounded-lg shadow-sm">
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1 text-board-dark"
            >
              설명 (선택)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
              placeholder="모임에 대한 간단한 설명을 입력하세요."
            />
          </div>

          {/* 비밀번호 카드 */}
          <div className="p-4 bg-board-light border border-board-secondary rounded-lg shadow-sm">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1 text-board-dark"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
              placeholder="모임 수정/삭제 시 사용"
            />
          </div>

          {/* --- 날짜 선택 UI (DatePicker + 칩) --- */}
          <div className="p-4 bg-board-light border border-board-secondary rounded-lg shadow-sm">
            <label className="block text-sm font-medium mb-2 text-board-dark">
              날짜 옵션 추가
            </label>
            <div className="flex items-center space-x-2">
              {/* react-datepicker 컴포넌트 */}
              <DatePicker
                selected={currentDateSelection} // 현재 선택된 값 (상태와 연결)
                onChange={(date: Date | null) => setCurrentDateSelection(date)} // 날짜 변경 시 상태 업데이트
                showTimeSelect // 시간 선택 활성화
                timeFormat="HH:mm" // 시간 표시 형식
                timeIntervals={15} // 시간 선택 간격 (15분)
                dateFormat="yyyy/MM/dd HH:mm" // 입력창에 표시될 형식
                locale={ko} // 한국어 설정
                className="w-full p-2 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white cursor-pointer caret-transparent focus:outline-none" // 스타일
                wrapperClassName="w-full" // DatePicker 감싸는 div 스타일 (너비 조절)
                placeholderText="클릭하여 날짜/시간 선택" // 안내 문구
                minDate={new Date()} // 오늘 이전 날짜 선택 불가
              />
              {/* 날짜 추가 버튼 */}
              <button
                type="button" // form 제출 방지
                onClick={handleAddDate} // 클릭 시 handleAddDate 함수 실행
                className="p-2 bg-board-secondary text-board-light rounded-md hover:bg-board-primary text-sm whitespace-nowrap" // 스타일 (줄바꿈 방지 추가)
                disabled={!currentDateSelection} // 날짜 선택 안됐으면 추가 버튼 비활성화
              >
                추가
              </button>
            </div>
            {/* 선택된 날짜 칩 목록 */}
            {selectedDates.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-board-dark/70">선택된 시간:</p>
                {selectedDates.map((date) => (
                  // 각 날짜 칩
                  <div
                    key={date.getTime()}
                    className="flex items-center justify-between bg-white p-1 px-2 rounded border border-board-secondary/30 text-xs shadow-sm"
                  >
                    {/* 날짜 텍스트 */}
                    <span>
                      {date.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </span>
                    {/* 삭제 버튼 */}
                    <button
                      type="button" // form 제출 방지
                      onClick={() => handleRemoveDate(date)} // 클릭 시 handleRemoveDate 함수 실행
                      className="ml-2 text-red-500 hover:text-red-700 font-bold"
                      aria-label="삭제"
                    >
                      &times; {/* 'X' 아이콘 */}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* --- 날짜 선택 UI 끝 --- */}

          {/* 마감일 카드 */}
          <div className="p-4 bg-board-light border border-board-secondary rounded-lg shadow-sm">
            <label
              htmlFor="deadline"
              className="block text-sm font-medium mb-1 text-board-dark"
            >
              투표 마감일
            </label>
            <input
              id="deadline"
              name="deadline"
              type="datetime-local"
              required
              value={formData.deadline}
              onChange={handleChange}
              className="w-full p-2 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
            />
          </div>

          {/* 에러 메시지 (스크롤 영역 하단에 표시될 수 있음) */}
          {error && (
            <p className="text-red-600 text-sm text-center py-1 bg-red-100 border border-red-400 rounded">
              {error}
            </p>
          )}
        </form>
      </div>
      {/* --- 스크롤 영역 끝 --- */}

      {/* --- 하단 고정 버튼 영역 --- */}
      {/* sticky: 스크롤 영역(.flex-grow) 내에서 고정, bottom-0: 아래쪽 */}
      {/* left-0 right-0: 부모 너비만큼, p-4 bg-board-light: 배경/패딩, border-t: 상단 구분선 */}
      {/* mt-auto: flex-grow 요소가 남은 공간을 다 차지하게 하여 버튼을 아래로 밀어냄 */}
      <div className="sticky bottom-0 left-0 right-0 px-4 pt-4 pb-12 bg-white mt-auto mr-2">
        <button
          type="button" // form 태그 밖에 있으므로 type="button"
          // onClick: 가상 이벤트 생성 및 handleSubmit 호출 (이전 설명과 동일)
          // 참고: useRef를 사용하여 form 참조 후 form.requestSubmit() 호출이 더 깔끔할 수 있음
          onClick={() => formRef.current?.requestSubmit()}
          disabled={isSubmitting} // 제출 중 비활성화
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors duration-300 shadow-sm ${
            isSubmitting
              ? "bg-board-secondary/50 text-board-dark/70 cursor-not-allowed" // 비활성화 스타일
              : "bg-board-secondary text-board-light hover:bg-board-primary" // 활성화 스타일
          }`}
        >
          {isSubmitting ? "생성 중..." : "모임 만들기"}
        </button>
      </div>
      {/* --- 고정 버튼 영역 끝 --- */}
    </div> // 최상위 div 끝
  );
} // CreateMeetingPage 컴포넌트 끝
