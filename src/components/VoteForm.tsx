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
        method: "POST",
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
        // 백엔드 에러 메시지 파싱 시도
        const errorData = await response
          .json()
          .catch(() => ({ error: "투표 제출 중 오류 발생" }));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      setSuccess(result.message || "투표가 성공적으로 제출되었습니다!");

      // --- ⬇️ 폼 초기화 주석 해제 ⬇️ ---
      // 투표 성공 시, 입력 필드와 선택된 날짜를 초기화합니다.
      setNickname("");
      setPassword("");
      setSelectedDates([]);
      // --- ⬆️ 폼 초기화 끝 ⬆️ ---
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
    // 카드 스타일: 배경 light, 테두리 secondary, 그림자 md
    <div className="w-full p-6 bg-board-light border border-board-secondary rounded-lg shadow-md text-board-dark">
      <h3 className="text-xl font-semibold mb-5 text-center">투표하기</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 닉네임 */}
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium mb-1">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            required // ✨ 필수 입력
            value={nickname} // ✨ 상태와 값 바인딩
            onChange={(e) => setNickname(e.target.value)} // ✨ 변경 시 상태 업데이트
            className="w-full p-2.5 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
            placeholder="참여할 닉네임" // ✨ placeholder 추가
          />
        </div>
        {/* 비밀번호 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            required // ✨ 필수 입력
            value={password} // ✨ 상태와 값 바인딩
            onChange={(e) => setPassword(e.target.value)} // ✨ 변경 시 상태 업데이트
            className="w-full p-2.5 rounded-md text-board-dark border border-board-secondary/50 focus:ring-2 focus:ring-board-accent-gold bg-white"
            placeholder="투표 수정/확인용" // ✨ placeholder 추가
          />
        </div>

        {/* 날짜 선택 */}
        <fieldset>
          <legend className="block text-sm font-medium mb-2">
            가능한 날짜 선택:
          </legend>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {dateOptions.map((option) => (
              // 항목 스타일: 배경 아주 연하게(white), 테두리 연하게
              <div
                key={option._id}
                className="flex items-center bg-white border border-board-secondary/30 p-2 rounded shadow-sm"
              >
                <input
                  id={option._id}
                  type="checkbox"
                  value={option._id}
                  checked={selectedDates.includes(option._id)}
                  onChange={() => handleCheckboxChange(option._id)}
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

        {/* 에러 및 성공 메시지 */}
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
          // 버튼 색상 변경 (secondary)
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
