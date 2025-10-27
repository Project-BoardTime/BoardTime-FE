"use client";

import Link from "next/link";
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

  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

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
    setCreatedMeetingId(null); // 이전 성공 상태 초기화 (★ 추가)

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

      // --- ★★★ 성공 시 로직 변경 ★★★ ---
      const result = await response.json();
      // alert("모임이 성공적으로 생성되었습니다!"); // alert 대신 UI로 표시
      setCreatedMeetingId(result.meetingId); // 생성된 ID를 상태에 저장 (★ 변경)
      // router.push(`/meetings/${result.meetingId}`); // 페이지 이동 로직 제거 (★ 변경)
      // --- ★★★ 변경 완료 ★★★ ---
    } catch (err: unknown) {
      // 에러 처리
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
      // setIsSubmitting(false); // ★ finally 블록으로 이동 권장
    } finally {
      setIsSubmitting(false); // ★ 성공/실패 여부와 관계없이 제출 상태 해제 (finally 블록 사용)
    }
  };

  const handleCopyLink = () => {
    if (!createdMeetingId) return;
    // window.location.origin은 현재 웹사이트 주소 (http://localhost:3000 등)
    const shareableLink = `${window.location.origin}/meetings/${createdMeetingId}`;
    navigator.clipboard
      .writeText(shareableLink)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // 2초 후 메시지 숨김
      })
      .catch((err) => {
        console.error("링크 복사 실패:", err);
        alert("링크 복사에 실패했습니다.");
      });
  };

  // createdMeetingId 상태에 값이 있으면 (생성 성공 시) 링크 공유 UI를 보여줍니다.
  if (createdMeetingId) {
    const shareableLink = `${window.location.origin}/meetings/${createdMeetingId}`;
    return (
      // 🎨 컨테이너 스타일 (배경은 layout에서 처리)
      <div className="text-center text-board-light">
        {" "}
        {/* 🎨 기본 텍스트 색상 변경 */}
        <h2 className="text-2xl font-bold mb-4">🎉 모임 생성 완료! 🎉</h2>
        <p className="mb-6">아래 링크를 참여자들에게 공유하세요.</p>
        <div className="mb-4">
          <input
            type="text"
            value={shareableLink}
            readOnly
            className="w-full p-2 border border-board-secondary rounded bg-board-light text-board-dark text-sm text-center" // 🎨 링크 필드 색상 변경
            onClick={(e) => e.currentTarget.select()}
          />
        </div>
        <button
          onClick={handleCopyLink}
          className="w-full bg-board-light text-board-dark font-bold py-2 px-4 rounded-lg hover:bg-board-secondary transition-colors duration-300 mb-2" // 🎨 버튼 색상 변경
        >
          {copySuccess ? "✅ 복사 완료!" : "🔗 링크 복사하기"}
        </button>
        <Link href={`/meetings/${createdMeetingId}`}>
          <span className="text-sm text-board-secondary hover:underline cursor-pointer">
            {" "}
            {/* 🎨 링크 텍스트 색상 변경 */}
            생성된 모임 확인하기 &rarr;
          </span>
        </Link>
      </div>
    );
  }

  // createdMeetingId 상태가 null이면 (생성 전 또는 실패 시) 기존 폼 UI를 보여줍니다.
  return (
    // 🎨 Fragment 유지 (배경은 layout에서 처리)
    <>
      <h2 className="text-3xl font-bold mb-6 text-center text-board-light">
        새로운 모임 만들기
      </h2>{" "}
      {/* 🎨 텍스트 색상 변경 */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* 모임 제목 */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium mb-1 text-board-light"
          >
            모임 제목
          </label>{" "}
          {/* 🎨 텍스트 색상 변경 */}
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-board-dark border border-board-secondary focus:ring-2 focus:ring-board-accent-gold" // 🎨 입력 필드 색상 변경
            placeholder="예: 프로젝트 회의 일정 조율"
          />
        </div>
        {/* 설명 */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1 text-board-light"
          >
            설명 (선택)
          </label>{" "}
          {/* 🎨 텍스트 색상 변경 */}
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-board-dark border border-board-secondary focus:ring-2 focus:ring-board-accent-gold" // 🎨 입력 필드 색상 변경
            placeholder="모임에 대한 간단한 설명을 입력하세요."
          />
        </div>
        {/* 비밀번호 */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1 text-board-light"
          >
            비밀번호
          </label>{" "}
          {/* 🎨 텍스트 색상 변경 */}
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-board-dark border border-board-secondary focus:ring-2 focus:ring-board-accent-gold" // 🎨 입력 필드 색상 변경
            placeholder="모임 수정/삭제 시 사용"
          />
        </div>
        {/* 날짜 옵션 */}
        <div>
          <label
            htmlFor="dateOptionsText"
            className="block text-sm font-medium mb-1 text-board-light"
          >
            날짜 옵션 (콤마로 구분)
          </label>{" "}
          {/* 🎨 텍스트 색상 변경 */}
          <input
            id="dateOptionsText"
            name="dateOptionsText"
            type="text"
            required
            placeholder="예: 2025-10-25 14:00, 2025-10-26 15:00"
            value={formData.dateOptionsText}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-board-dark border border-board-secondary focus:ring-2 focus:ring-board-accent-gold" // 🎨 입력 필드 색상 변경
          />
          <p className="text-xs text-board-light/70 mt-1">
            정확한 날짜와 시간(YYYY-MM-DD HH:MM) 형식으로 입력해주세요.
          </p>{" "}
          {/* 🎨 보조 텍스트 색상 변경 */}
        </div>
        {/* 마감일 */}
        <div>
          <label
            htmlFor="deadline"
            className="block text-sm font-medium mb-1 text-board-light"
          >
            투표 마감일
          </label>{" "}
          {/* 🎨 텍스트 색상 변경 */}
          <input
            id="deadline"
            name="deadline"
            type="datetime-local"
            required
            value={formData.deadline}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-board-dark border border-board-secondary focus:ring-2 focus:ring-board-accent-gold" // 🎨 입력 필드 색상 변경
          />
        </div>
        {/* 에러 메시지 */}
        {error && (
          <p className="text-red-400 text-sm text-center py-1 bg-red-900/50 rounded">
            {error}
          </p>
        )}{" "}
        {/* 🎨 에러 배경/텍스트 색상 조정 */}
        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors duration-300 mt-6 ${
            isSubmitting
              ? "bg-board-secondary/50 text-board-light/70 cursor-not-allowed" // 🎨 비활성화 색상 변경
              : "bg-board-light text-board-dark hover:bg-board-secondary" // 🎨 버튼 색상 변경
          }`}
        >
          {isSubmitting ? "생성 중..." : "모임 만들기"}
        </button>
      </form>
    </>
  );
}
