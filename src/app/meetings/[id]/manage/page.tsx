"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// API 응답 타입 (모임 상세 정보)
interface MeetingDetails {
  _id: string;
  title: string;
  description: string;
  deadline: string; // ISO 문자열 형태 예상
  // password는 API 응답에 포함되지 않아야 함 (검색 API 참고)
}

// 폼 데이터 타입 (비밀번호 필드 추가)
interface FormData extends Omit<MeetingDetails, "_id"> {
  password: string; // 수정 권한 확인용
}

export default function ManageMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    deadline: "",
    password: "", // 비밀번호 필드 추가
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. 초기 데이터 로딩 (useEffect)
  useEffect(() => {
    if (!id) return;

    const fetchInitialData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/be/meetings/${id}`); // rewrites 사용
        if (!response.ok) {
          throw new Error("모임 정보를 불러오는데 실패했습니다.");
        }
        const data: MeetingDetails = await response.json();

        // 받아온 데이터로 폼 상태 초기화 (날짜 형식 변환 주의)
        setFormData({
          title: data.title || "",
          description: data.description || "",
          // datetime-local input은 'YYYY-MM-DDTHH:MM' 형식을 요구
          deadline: data.deadline
            ? new Date(data.deadline).toISOString().slice(0, 16)
            : "",
          password: "", // 비밀번호는 비워둠
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류 발생");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [id]); // id가 변경될 때만 실행

  // 2. 폼 입력 변경 핸들러 (useState)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // 3. 폼 제출 핸들러 (API 호출)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!formData.password) {
      setError("변경 사항을 저장하려면 현재 비밀번호를 입력해야 합니다.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/be/meetings/${id}`, {
        // PUT 요청
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          throw new Error(errorData.error || "비밀번호가 일치하지 않습니다.");
        }
        throw new Error(errorData.error || "모임 정보 수정에 실패했습니다.");
      }

      setSuccess("모임 정보가 성공적으로 수정되었습니다.");
      // 선택: 수정 후 상세 페이지로 다시 이동
      // router.push(`/meetings/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류 발생");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 렌더링 로직 ---
  if (initialLoading) {
    return (
      <div className="text-center text-gray-400">모임 정보 로딩 중...</div>
    );
  }

  // 초기 로딩 에러 시 (모임 ID가 잘못되었거나 API 문제)
  if (error && !success) {
    return <div className="text-center text-red-400">오류: {error}</div>;
  }

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-center">모임 정보 수정</h2>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* 모임 제목 수정 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            모임 제목
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* 설명 수정 */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            설명
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* 마감일 수정 */}
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium mb-1">
            투표 마감일
          </label>
          <input
            id="deadline"
            name="deadline"
            type="datetime-local"
            required
            value={formData.deadline}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <hr className="my-4 border-blue-500" /> {/* 구분선 */}
        {/* 비밀번호 확인 입력 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            현재 비밀번호 확인
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="변경 사항 저장을 위해 입력"
          />
          <p className="text-xs text-blue-200 mt-1">
            모임 생성 시 설정한 비밀번호를 입력해야 수정이 완료됩니다.
          </p>
        </div>
        {/* 에러 및 성공 메시지 */}
        {error && (
          <p className="text-red-300 text-sm text-center py-1 bg-red-800 rounded">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-200 text-sm text-center py-1 bg-green-800 rounded">
            {success}
          </p>
        )}
        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-colors duration-300 mt-6 ${
            isSubmitting
              ? "bg-gray-400 text-gray-800 cursor-not-allowed"
              : "bg-white text-blue-600 hover:bg-blue-100"
          }`}
        >
          {isSubmitting ? "저장 중..." : "수정 완료"}
        </button>
      </form>
    </>
  );
}
