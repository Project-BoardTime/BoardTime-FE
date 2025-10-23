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
    <div className="w-full p-4 bg-green-700 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-center">투표하기</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium mb-1">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full p-2 rounded-lg text-gray-800"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded-lg text-gray-800"
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium mb-2">
            가능한 날짜 선택:
          </legend>
          <div className="space-y-2">
            {dateOptions.map((option) => (
              <div key={option._id} className="flex items-center">
                <input
                  id={option._id}
                  type="checkbox"
                  value={option._id}
                  checked={selectedDates.includes(option._id)}
                  onChange={() => handleCheckboxChange(option._id)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                />
                <label htmlFor={option._id} className="text-sm">
                  {new Date(option.date).toLocaleString("ko-KR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {success && (
          <p className="text-green-300 text-sm text-center">{success}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-2 px-4 rounded-lg transition-colors duration-300 mt-4 ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-white text-green-700 hover:bg-green-100"
          }`}
        >
          {isSubmitting ? "제출 중..." : "투표하기 / 수정하기"}
        </button>
      </form>
    </div>
  );
}
