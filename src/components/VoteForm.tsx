"use client";

import { useState } from "react";

// MeetingPage로부터 받을 props 타입을 정의합니다.
interface VoteFormProps {
  meetingId: string;
  dateOptions: { _id: string; date: string }[]; // 투표에 필요한 날짜 정보만 받음
}

export default function VoteForm({ meetingId, dateOptions }: VoteFormProps) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]); // 선택된 날짜 ID 배열
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (optionId: string) => {
    setSelectedDates(
      (prevSelected) =>
        prevSelected.includes(optionId)
          ? prevSelected.filter((id) => id !== optionId) // 이미 있으면 제거
          : [...prevSelected, optionId] // 없으면 추가
    );
  };

  // 폼 제출 핸들러 (API 호출)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedDates.length === 0) {
      setError("하나 이상의 날짜를 선택해주세요.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/be/meetings/${meetingId}/votes`, {
        // rewrite 경로 사용
        method: "POST", // 또는 PUT, 백엔드 라우터 설정에 따라
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          password,
          dateOptionIds: selectedDates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "투표 제출에 실패했습니다.");
      }

      const result = await response.json();
      setSuccess(result.message || "투표가 성공적으로 제출되었습니다!");
      // 선택적으로 폼 초기화
      // setNickname('');
      // setPassword('');
      // setSelectedDates([]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ✨ 카드 스타일: 배경 light, 테두리 secondary, 그림자 md
    <div className="w-full p-6 bg-board-light border border-board-secondary rounded-lg shadow-md text-board-dark">
      <h3 className="text-xl font-semibold mb-5 text-center">투표하기</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 닉네임 */}
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium mb-1">
            닉네임
          </label>
          <input
            id="nickname" /* ... */
            className="w-full p-2.5 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
          />
        </div>
        {/* 비밀번호 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            비밀번호
          </label>
          <input
            id="password"
            type="password" /* ... */
            className="w-full p-2.5 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
          />
        </div>

        {/* 날짜 선택 */}
        <fieldset>
          <legend className="block text-sm font-medium mb-2">
            가능한 날짜 선택:
          </legend>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {dateOptions.map((option) => (
              // ✨ 항목 스타일: 배경 아주 연하게(white), 테두리 연하게
              <div
                key={option._id}
                className="flex items-center bg-white border border-board-secondary/30 p-2 rounded shadow-sm"
              >
                <input
                  id={option._id}
                  type="checkbox" /* ... */
                  // ✨ 체크박스 색상 변경 (accent-gold)
                  className="h-4 w-4 text-board-accent-gold border-board-secondary/50 rounded focus:ring-board-accent-gold mr-3 cursor-pointer"
                />
                <label htmlFor={option._id} className="text-sm cursor-pointer">
                  {new Date(option.date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="text-red-600 text-xs text-center py-1 bg-red-100 border border-red-400 rounded">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-600 text-xs text-center py-1 bg-green-100 border border-green-400 rounded">
            {success}
          </p>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          // ✨ 버튼 색상 변경 (secondary)
          className={`w-full font-bold py-2.5 px-4 rounded-md transition-all duration-300 mt-5 shadow-sm ${
            isSubmitting
              ? "bg-board-secondary/50 text-board-light/70 cursor-not-allowed"
              : "bg-board-secondary text-board-light hover:bg-board-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-board-light focus:ring-board-primary"
          }`}
        >
          {isSubmitting ? "제출 중..." : "투표 제출"}
        </button>
      </form>
    </div>
  );
}
