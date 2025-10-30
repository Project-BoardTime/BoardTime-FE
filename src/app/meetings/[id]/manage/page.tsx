"use client";

import { useEffect, useState, useRef } from "react"; // useRef 임포트
import { useParams, useRouter } from "next/navigation";
import DatePicker from "react-datepicker"; // DatePicker 임포트
import "react-datepicker/dist/react-datepicker.css"; // CSS 임포트
import { ko } from "date-fns/locale"; // 한국어 로케일

// API 응답 타입 (모임 상세 정보)
interface MeetingDetails {
  _id: string;
  title: string;
  description: string;
  deadline: string; // ISO 문자열 형태 예상
  dateOptions: { _id: string; date: string; votes: string[] }[]; // dateOptions 포함
}

// 폼 데이터 타입 (비밀번호 + 수정 가능 필드)
// ✨ dateOptions는 별도 상태로 관리하므로 여기서 제외
interface FormData extends Omit<MeetingDetails, "_id" | "dateOptions"> {
  password: string;
}

export default function ManageMeetingPage() {
  const router = useRouter(); // 페이지 이동용
  const params = useParams(); // URL 파라미터 가져오기
  const id = params.id as string; // 모임 ID 추출
  const formRef = useRef<HTMLFormElement>(null); // form 태그 참조용 ref

  // 폼 상태 (제목, 설명, 마감일, 비밀번호) - dateOptions 제외됨
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    deadline: "",
    password: "",
  });

  // 선택된 날짜 옵션 상태 (Date 객체 배열)
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  // DatePicker가 현재 선택 중인 값 상태
  const [currentDateSelection, setCurrentDateSelection] = useState<Date | null>(
    null
  );

  // 로딩 및 API 호출 상태 관리
  const [initialLoading, setInitialLoading] = useState(true); // 초기 데이터 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false); // 폼 제출(수정) 중 상태
  const [error, setError] = useState<string | null>(null); // 에러 메시지 상태
  const [success, setSuccess] = useState<string | null>(null); // 성공 메시지 상태

  // 1. 컴포넌트 마운트 시 초기 데이터 로딩 useEffect
  useEffect(() => {
    if (!id) return; // id 없으면 중단

    const fetchInitialData = async () => {
      setInitialLoading(true); // 로딩 시작
      setError(null); // 에러 초기화
      try {
        // 백엔드 API 호출 (rewrites 경로 사용)
        const response = await fetch(`/api/be/meetings/${id}`);
        if (!response.ok) {
          throw new Error("모임 정보를 불러오는데 실패했습니다.");
        }
        const data: MeetingDetails = await response.json(); // 데이터 파싱

        // 폼 상태 초기화 (dateOptions 제외)
        setFormData({
          title: data.title || "",
          description: data.description || "",
          // datetime-local input 형식(YYYY-MM-DDTHH:MM)에 맞게 변환
          deadline: data.deadline
            ? new Date(data.deadline).toISOString().slice(0, 16)
            : "",
          password: "", // 비밀번호는 비워둠
        });

        // 날짜 옵션 상태 초기화
        setSelectedDates(
          data.dateOptions
            .map((option) => new Date(option.date))
            .sort((a, b) => a.getTime() - b.getTime())
        );
      } catch (err: unknown) {
        // 에러 처리
        setError(err instanceof Error ? err.message : "알 수 없는 오류 발생");
      } finally {
        setInitialLoading(false); // 로딩 종료
      }
    };

    fetchInitialData(); // 함수 실행
  }, [id]); // id가 변경될 때만 다시 실행

  // 2. 일반 폼 입력 필드 변경 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // 3. 날짜 추가 핸들러
  const handleAddDate = () => {
    if (
      currentDateSelection &&
      !selectedDates.some((d) => d.getTime() === currentDateSelection.getTime())
    ) {
      setSelectedDates((prev) =>
        [...prev, currentDateSelection].sort(
          (a, b) => a.getTime() - b.getTime()
        )
      );
    } else if (currentDateSelection) {
      alert("이미 선택된 시간입니다.");
    }
  };

  // 4. 날짜 제거 핸들러
  const handleRemoveDate = (dateToRemove: Date) => {
    setSelectedDates((prev) =>
      prev.filter((date) => date.getTime() !== dateToRemove.getTime())
    );
  };

  // 5. 폼 제출 핸들러 (수정 완료 버튼 클릭)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 기본 동작 방지
    setIsSubmitting(true); // 제출 시작
    setError(null); // 에러 초기화
    setSuccess(null); // 성공 메시지 초기화

    // 비밀번호 입력 확인
    if (!formData.password) {
      setError("변경 사항을 저장하려면 현재 비밀번호를 입력해야 합니다.");
      setIsSubmitting(false);
      return;
    }
    // 날짜 옵션 유효성 검사
    if (selectedDates.length === 0) {
      setError("날짜 옵션은 최소 하나 이상 필요합니다.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 백엔드 수정 API 호출 (PUT 메서드, rewrites 경로 사용)
      const response = await fetch(`/api/be/meetings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: formData.password, // 인증용 비밀번호
          title: formData.title, // 수정된 제목
          description: formData.description, // 수정된 설명
          deadline: formData.deadline, // 수정된 마감일
          dateOptions: selectedDates.map((date) => date.toISOString()), // 수정된 날짜 옵션 배열
        }),
      });

      // 응답 상태 확인
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          throw new Error(errorData.error || "비밀번호가 일치하지 않습니다.");
        }
        throw new Error(errorData.error || "모임 정보 수정에 실패했습니다.");
      }

      // 수정 성공 시 메시지 표시
      setSuccess("모임 정보가 성공적으로 수정되었습니다.");
      // 비밀번호 필드 비우기
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err: unknown) {
      // 에러 처리
      setError(err instanceof Error ? err.message : "알 수 없는 오류 발생");
    } finally {
      setIsSubmitting(false); // 제출 종료
    }
  };

  // --- 렌더링 로직 시작 ---

  // 초기 데이터 로딩 중 표시
  if (initialLoading) {
    return (
      <div className="text-center text-board-dark/70">모임 정보 로딩 중...</div>
    );
  }

  // 초기 로딩 에러 시 표시
  if (error && !success && formData.title === "") {
    return <div className="text-center text-red-600">오류: {error}</div>;
  }

  // 최종 UI 렌더링
  return (
    // 최상위 div에 flex-col과 h-full 추가하여 고정 버튼 레이아웃 지원
    <div className="flex flex-col">
      <h2 className="text-3xl font-bold mb-6 text-center text-board-dark">
        모임 정보 수정
      </h2>

      {/* --- 스크롤 가능한 폼 영역 --- */}
      {/* flex-grow: 남은 세로 공간 차지, overflow-y-auto: 세로 스크롤 */}
      {/* pr-2: 스크롤바 여백, pt-4: 상단 여백, pb-24: 하단 고정 버튼 위한 여백 */}
      <div className="flex-grow overflow-y-auto pr-2 pt-4 pb-4">
        {/* form 태그에 ref 연결 */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col space-y-4"
        >
          {/* 모임 제목 수정 카드 */}
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
            />
          </div>

          {/* 설명 수정 카드 */}
          <div className="p-4 bg-board-light border border-board-secondary rounded-lg shadow-sm">
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1 text-board-dark"
            >
              설명
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
            />
          </div>

          {/* --- 날짜 옵션 수정 UI --- */}
          <div className="p-4 bg-board-light border border-board-secondary rounded-lg shadow-sm">
            <label className="block text-sm font-medium mb-2 text-board-dark">
              날짜 옵션 수정
            </label>
            <div className="flex items-center space-x-2">
              {/* DatePicker */}
              <DatePicker
                selected={currentDateSelection}
                onChange={(date: Date | null) => setCurrentDateSelection(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy/MM/dd HH:mm"
                locale={ko}
                className="w-full p-2 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white cursor-pointer caret-transparent focus:outline-none"
                wrapperClassName="w-full"
                placeholderText="클릭하여 날짜/시간 선택"
                minDate={new Date()} // 과거 날짜 선택 불가
              />
              {/* 추가 버튼 */}
              <button
                type="button"
                onClick={handleAddDate}
                className="p-2 bg-board-secondary text-board-light rounded-md hover:bg-board-primary text-sm whitespace-nowrap"
                disabled={!currentDateSelection}
              >
                추가
              </button>
            </div>
            {/* 선택된 날짜 칩 목록 */}
            {selectedDates.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-board-dark/70">선택된 시간:</p>
                {selectedDates.map((date) => (
                  <div
                    key={date.getTime()}
                    className="flex items-center justify-between bg-white p-1 px-2 rounded border border-board-secondary/30 text-xs shadow-sm"
                  >
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
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(date)}
                      className="ml-2 text-red-500 hover:text-red-700 font-bold"
                      aria-label="삭제"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* --- 날짜 옵션 수정 UI 끝 --- */}

          {/* 마감일 수정 카드 */}
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

          {/* 구분선 */}
          <hr className="my-4 border-board-secondary" />

          {/* 비밀번호 확인 카드 */}
          <div className="p-4 bg-board-light border border-board-secondary rounded-lg shadow-sm">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1 text-board-dark"
            >
              현재 비밀번호 확인
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
              placeholder="변경 사항 저장을 위해 입력"
            />
            <p className="text-xs text-board-dark/70 mt-1">
              모임 생성 시 설정한 비밀번호를 입력해야 수정이 완료됩니다.
            </p>
          </div>

          {/* 수정 시 에러/성공 메시지 표시 */}
          {error && (
            <p className="text-red-600 text-sm text-center py-1 bg-red-100 border border-red-400 rounded">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-600 text-sm text-center py-1 bg-green-100 border border-green-400 rounded">
              {success}
            </p>
          )}
        </form>
      </div>
      {/* --- 스크롤 영역 끝 --- */}

      {/* --- 하단 고정 버튼 영역 --- */}
      {/* sticky: 스크롤 영역(.flex-grow) 내에서 고정, bottom-0: 아래쪽 */}
      {/* p-4 bg-board-light: 배경/패딩, border-t: 상단 구분선, mt-auto: 위로 밀어냄 */}
      {/* mr-2: 스크롤바 공간 확보 */}
      <div className="sticky bottom-0 left-0 right-0 px-4 pt-4 pb-12 bg-white mt-auto mr-2">
        <button
          type="button"
          onClick={() => formRef.current?.requestSubmit()} // ref 사용
          disabled={isSubmitting}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors duration-300 shadow-sm ${
            isSubmitting
              ? "bg-board-secondary/50 text-board-dark/70 cursor-not-allowed" // 비활성화
              : "bg-board-secondary text-board-light hover:bg-board-primary" // 활성화
          }`}
        >
          {isSubmitting ? "저장 중..." : "수정 완료"}
        </button>
      </div>
      {/* --- 고정 버튼 영역 끝 --- */}
    </div> // 최상위 div 끝
  );
}
