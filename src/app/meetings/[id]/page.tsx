"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VoteForm from "@/components/VoteForm";
import ResultDisplay from "@/components/ResultDisplay";

// API 응답 데이터 타입을 정의 (TypeScript)
interface MeetingDetails {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  isExpired: boolean;
  dateOptions: { _id: string; date: string; votes: string[] }[];
  participants: { _id: string; nickname: string }[];
  // 필요에 따라 다른 필드 추가
}

export default function MeetingPage() {
  const params = useParams(); // URL 파라미터 객체를 가져옴
  const id = params.id as string; // 객체에서 id 값을 추출 (타입 단언)

  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트가 마운트될 때 API를 호출하여 모임 데이터를 가져옵니다.
  useEffect(() => {
    if (!id) return; // id가 아직 없으면 실행하지 않음

    const fetchMeeting = async () => {
      setLoading(true);
      setError(null);
      try {
        // const response = await fetch(
        //   `${process.env.NEXT_PUBLIC_API_URL}/api/meetings/${id}`
        // );

        const response = await fetch(
          `/api/be/meetings/${id}` // 새 방식, rewrite 경로 사용
        );
        if (!response.ok) {
          throw new Error("모임 정보를 불러오는데 실패했습니다.");
        }
        const data: MeetingDetails = await response.json();
        setMeeting(data);
        console.log("meeting.isExpired", data.isExpired);
      } catch (err: unknown) {
        // 👈 err의 타입을 unknown으로 변경
        // err의 실제 타입이 Error 클래스의 인스턴스인지 확인
        if (err instanceof Error) {
          setError(err.message); // Error 객체라면 message 속성에 접근
        } else {
          // Error 객체가 아니라면 일반적인 메시지 표시
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [id]); // id 값이 변경될 때만 이 useEffect를 다시 실행

  // --- 렌더링 로직 ---
  if (loading) {
    return <div className="text-center">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400">오류: {error}</div>;
  }

  if (!meeting) {
    return <div className="text-center">모임 정보를 찾을 수 없습니다.</div>;
  }

  // isExpired 값에 따라 다른 UI를 렌더링
  return (
    <div>
      <h2 className="text-3xl font-bold mb-4 text-center">{meeting.title}</h2>
      <p className="mb-6 text-center">{meeting.description}</p>

      {meeting.isExpired ? (
        // 마감 후: ResultDisplay 컴포넌트 렌더링
        <ResultDisplay
          meetingId={meeting._id}
          dateOptions={meeting.dateOptions}
        />
      ) : (
        // 마감 전: VoteForm 컴포넌트 렌더링
        <VoteForm meetingId={meeting._id} dateOptions={meeting.dateOptions} />
      )}

      {/* 여기에 마감일, 날짜 옵션 목록 등을 추가로 표시할 수 있습니다. */}
      <p className="mt-4 text-sm text-center">
        마감일: {new Date(meeting.deadline).toLocaleString()}
      </p>
    </div>
  );
}
