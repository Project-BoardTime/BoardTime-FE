"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// API 응답 타입 (모임 상세 정보)
interface MeetingDetails {
  _id: string;
  title: string;
  description: string;
  deadline: string; // ISO 문자열 형태 예상
}

// 폼 데이터 타입 (비밀번호 필드 추가)
interface FormData extends Omit<MeetingDetails, "_id"> {
  password: string; // 수정 권한 확인용
}

export default function ManageMeetingPage() {
  const router = useRouter(); // 페이지 이동용
  const params = useParams(); // URL 파라미터 가져오기
  const id = params.id as string; // 모임 ID 추출

  // 폼 데이터 상태
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    deadline: "",
    password: "", // 비밀번호 필드 추가
  });
  const [initialLoading, setInitialLoading] = useState(true); // 초기 데이터 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false); // 폼 제출(수정) 중 상태
  const [error, setError] = useState<string | null>(null); // 에러 메시지 상태
  const [success, setSuccess] = useState<string | null>(null); // 성공 메시지 상태

  // 1. 컴포넌트 마운트 시 초기 데이터 로딩하는 useEffect
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

        // 받아온 데이터로 폼 상태 초기화
        setFormData({
          title: data.title || "",
          description: data.description || "",
          // datetime-local input 형식(YYYY-MM-DDTHH:MM)에 맞게 변환
          deadline: data.deadline
            ? new Date(data.deadline).toISOString().slice(0, 16)
            : "",
          password: "", // 비밀번호는 비워둠
        });
      } catch (err: unknown) {
        // 에러 처리
        setError(err instanceof Error ? err.message : "알 수 없는 오류 발생");
      } finally {
        setInitialLoading(false); // 로딩 종료
      }
    };

    fetchInitialData(); // 함수 실행
  }, [id]); // id가 변경될 때만 다시 실행

  // 2. 폼 입력 필드 변경 시 상태 업데이트하는 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState, // 이전 상태 복사
      [name]: value, // 변경된 필드만 업데이트
    }));
  };

  // 3. 폼 제출(수정 완료 버튼 클릭) 시 실행될 핸들러
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

    try {
      // 백엔드 수정 API 호출 (PUT 메서드, rewrites 경로 사용)
      const response = await fetch(`/api/be/meetings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // password는 인증용, 나머지는 수정될 필드
          password: formData.password,
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline,
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
      // 선택적으로 비밀번호 필드 비우기
      setFormData((prev) => ({ ...prev, password: "" }));
      // 선택: 수정 후 상세 페이지로 다시 이동 (2초 후)
      // setTimeout(() => router.push(`/meetings/${id}`), 2000);
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

  // 초기 로딩 에러 시 표시 (잘못된 ID 등)
  // 에러 상태이고, 성공 메시지가 없을 때만 표시 (수정 실패 에러는 폼 아래에 표시)
  if (error && !success && formData.title === "") {
    return <div className="text-center text-red-600">오류: {error}</div>;
  }

  // 최종 UI 렌더링
  return (
    // Fragment 사용
    <>
      <h2 className="text-3xl font-bold mb-6 text-center text-board-dark">
        모임 정보 수정
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
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

        {/* 수정 완료 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors duration-300 mt-6 shadow-sm ${
            isSubmitting
              ? "bg-board-secondary/50 text-board-dark/70 cursor-not-allowed" // 비활성화
              : "bg-board-secondary text-board-light hover:bg-board-primary" // 활성화
          }`}
        >
          {isSubmitting ? "저장 중..." : "수정 완료"}
        </button>
      </form>
    </>
  );
}
