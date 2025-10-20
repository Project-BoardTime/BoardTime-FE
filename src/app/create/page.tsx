"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateMeetingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    password: "",
    deadline: "",
    dateOptionsText: "", // 날짜 입력을 위한 임시 텍스트 상태
  });

  // 폼 입력값이 변경될 때마다 상태를 업데이트하는 함수
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // 폼 제출 시 API 호출을 처리하는 함수
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 콤마로 구분된 날짜 텍스트를 배열로 변환
    const dateOptions = formData.dateOptionsText
      .split(",")
      .map((date) => date.trim())
      .filter((date) => date);

    if (dateOptions.length === 0) {
      alert("날짜 옵션을 하나 이상 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/meetings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            password: formData.password,
            deadline: formData.deadline,
            dateOptions: dateOptions,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("모임 생성에 실패했습니다.");
      }

      const result = await response.json();
      alert("모임이 성공적으로 생성되었습니다!");

      // 생성된 모임 상세 페이지로 이동
      router.push(`/meetings/${result.meetingId}`);
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-center">
        새로운 모임 만들기
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* 제목 입력 필드 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            모임 제목
          </label>
          <input id="title" name="title" /* ... props ... */ />
        </div>

        {/* 설명 입력 필드 */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            설명
          </label>
          <textarea id="description" name="description" /* ... props ... */ />
        </div>

        {/* 비밀번호 입력 필드 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password" /* ... props ... */
          />
        </div>

        {/* 날짜 옵션 입력 필드 */}
        <div>
          <label
            htmlFor="dateOptionsText"
            className="block text-sm font-medium mb-1"
          >
            날짜 옵션 (콤마로 구분)
          </label>
          <input
            id="dateOptionsText"
            name="dateOptionsText" /* ... props ... */
          />
        </div>

        {/* 마감일 입력 필드 */}
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium mb-1">
            투표 마감일
          </label>
          <input
            id="deadline"
            name="deadline"
            type="datetime-local" /* ... props ... */
          />
        </div>

        {/* 제출 버튼 */}
        <button type="submit" /* ... className ... */>모임 만들기</button>
      </form>
    </>
  );
}
