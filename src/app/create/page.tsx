"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // next/navigation 에서 useRouter 임포트

export default function CreateMeetingPage() {
  const router = useRouter(); // useRouter 훅 사용 초기화
  // useState 훅으로 폼 데이터 상태 관리
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    password: "",
    deadline: "",
    dateOptionsText: "", // 날짜 입력을 위한 임시 텍스트 상태
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중 상태 관리
  const [error, setError] = useState<string | null>(null); // 에러 메시지 상태 관리

  // 입력 필드 값이 변경될 때 호출되는 함수
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState, // 기존 상태 복사
      [name]: value, // 변경된 필드만 업데이트 (새 객체 반환)
    }));
  };

  // 폼 제출 시 호출되는 함수
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 기본 폼 제출 동작 막기
    setIsSubmitting(true); // 제출 시작 상태
    setError(null); // 이전 에러 메시지 초기화

    // 콤마로 구분된 날짜 텍스트를 배열로 변환하고 앞뒤 공백 제거
    const dateOptions = formData.dateOptionsText
      .split(",")
      .map((date) => date.trim())
      .filter((date) => date); // 빈 문자열 제거

    // 날짜 옵션 유효성 검사
    if (dateOptions.length === 0) {
      setError("날짜 옵션을 하나 이상 입력해주세요. (콤마로 구분)");
      setIsSubmitting(false);
      return;
    }

    try {
      // 백엔드 API 호출 (rewrites 경로 사용)
      const response = await fetch(`/api/be/meetings`, {
        // POST 요청
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // 상태 데이터를 JSON 문자열로 변환하여 전송
          title: formData.title,
          description: formData.description,
          password: formData.password,
          deadline: formData.deadline, // HTML datetime-local input 값은 ISO 형식과 유사
          dateOptions: dateOptions, // 날짜 문자열 배열 전송
          // placeName, placeLat, placeLng 등은 현재 폼에 없으므로 생략
        }),
      });

      // 응답 상태 확인
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "모임 생성 중 오류 발생" }));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      // 성공 시 결과 처리
      const result = await response.json();
      alert("모임이 성공적으로 생성되었습니다!");

      // 생성된 모임 상세 페이지로 이동 (useRouter 사용)
      router.push(`/meetings/${result.meetingId}`);
    } catch (err: unknown) {
      // 에러 처리
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
      setIsSubmitting(false); // 에러 발생 시 제출 상태 해제
    }
    // finally 블록 대신 여기서 처리해도 됨
    // finally {
    //   setIsSubmitting(false); // 성공/실패 여부와 관계없이 제출 상태 해제
    // }
  };

  // JSX 구조 (UI 렌더링)
  return (
    // 레이아웃은 layout.tsx에서 처리하므로 내부 컨텐츠만 작성
    <>
      <h2 className="text-3xl font-bold mb-6 text-center">
        새로운 모임 만들기
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* 모임 제목 입력 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            모임 제목
          </label>
          <input
            id="title"
            name="title" // 상태 객체의 키와 일치
            type="text"
            required // 필수 입력
            value={formData.title} // 상태와 값 연결
            onChange={handleChange} // 변경 시 핸들러 연결
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="예: 프로젝트 회의 일정 조율"
          />
        </div>

        {/* 설명 입력 */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            설명 (선택)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="모임에 대한 간단한 설명을 입력하세요."
          />
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="모임 수정/삭제 시 사용"
          />
        </div>

        {/* 날짜 옵션 입력 */}
        <div>
          <label
            htmlFor="dateOptionsText"
            className="block text-sm font-medium mb-1"
          >
            날짜 옵션 (콤마로 구분)
          </label>
          <input
            id="dateOptionsText"
            name="dateOptionsText"
            type="text"
            required
            placeholder="예: 2025-10-25 14:00, 2025-10-26 15:00"
            value={formData.dateOptionsText}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-blue-200 mt-1">
            정확한 날짜와 시간(YYYY-MM-DD HH:MM) 형식으로 입력해주세요.
          </p>
        </div>

        {/* 마감일 입력 */}
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium mb-1">
            투표 마감일
          </label>
          <input
            id="deadline"
            name="deadline"
            type="datetime-local" // 날짜 및 시간 선택 UI 제공
            required
            value={formData.deadline}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 에러 메시지 표시 */}
        {error && (
          <p className="text-red-300 text-sm text-center py-1 bg-red-800 rounded">
            {error}
          </p>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting} // 제출 중일 때 비활성화
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors duration-300 mt-6 ${
            isSubmitting
              ? "bg-gray-400 text-gray-800 cursor-not-allowed"
              : "bg-white text-blue-600 hover:bg-blue-100"
          }`}
        >
          {isSubmitting ? "생성 중..." : "모임 만들기"}
        </button>
      </form>
    </>
  );
}
