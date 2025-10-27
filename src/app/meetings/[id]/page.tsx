"use client";

import { useEffect, useState, Fragment } from "react"; // Fragment 추가
import { useParams } from "next/navigation";
import VoteForm from "@/components/VoteForm"; // 투표 폼 컴포넌트
import ResultDisplay from "@/components/ResultDisplay"; // 결과 표시 컴포넌트

// API 응답 데이터 타입
interface MeetingDetails {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  isExpired: boolean;
  dateOptions: { _id: string; date: string; votes: string[] }[];
  participants: { _id: string; nickname: string }[];
}

export default function MeetingPage() {
  const params = useParams(); // URL 파라미터 가져오기
  const id = params.id as string; // 모임 ID 추출

  // 상태 변수 정의
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null); // 모임 데이터
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState<string | null>(null); // 에러 상태

  // 컴포넌트 마운트 시 데이터 가져오는 useEffect
  useEffect(() => {
    if (!id) return; // ID 없으면 중단

    const fetchMeeting = async () => {
      setLoading(true); // 로딩 시작
      setError(null); // 에러 초기화
      try {
        // 백엔드 API 호출 (rewrites 경로 사용)
        const response = await fetch(`/api/be/meetings/${id}`);
        if (!response.ok) {
          throw new Error("모임 정보를 불러오는데 실패했습니다.");
        }
        const data: MeetingDetails = await response.json(); // 데이터 파싱
        setMeeting(data); // 상태 업데이트
      } catch (err: unknown) {
        // 에러 처리
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false); // 로딩 종료
      }
    };

    fetchMeeting(); // 함수 실행
  }, [id]); // id가 변경될 때만 다시 실행

  // --- 렌더링 로직 시작 ---

  // 로딩 중 표시
  if (loading) {
    // ✨ 텍스트 색상 변경
    return <div className="text-center text-board-dark/70">로딩 중...</div>;
  }

  // 에러 발생 시 표시
  if (error) {
    // ✨ 에러 색상 유지 또는 text-red-600 등으로 변경 가능
    return <div className="text-center text-red-600">오류: {error}</div>;
  }

  // 모임 데이터 없을 시 표시
  if (!meeting) {
    // ✨ 텍스트 색상 변경
    return (
      <div className="text-center text-board-dark/70">
        모임 정보를 찾을 수 없습니다.
      </div>
    );
  }

  // 최종 UI 렌더링
  return (
    // Fragment 사용 (카드 틀은 layout.tsx에 있음)
    <Fragment>
      {/* 모임 제목 */}
      {/* ✨ 텍스트 색상 변경 */}
      <h2 className="text-3xl font-bold mb-4 text-center text-board-dark">
        {meeting.title}
      </h2>
      {/* 모임 설명 */}
      {/* ✨ 텍스트 색상 변경 (약간 연하게) */}
      <p className="mb-6 text-board-dark/80">{meeting.description}</p>

      {/* 마감 여부에 따라 투표 폼 또는 결과 표시 */}
      {meeting.isExpired ? (
        // 마감 후: 결과 표시 컴포넌트 렌더링
        <ResultDisplay
          meetingId={meeting._id}
          dateOptions={meeting.dateOptions}
        />
      ) : (
        // 마감 전: 투표 폼 컴포넌트 렌더링
        <VoteForm meetingId={meeting._id} dateOptions={meeting.dateOptions} />
      )}

      {/* 마감일 표시 */}
      {/* ✨ 텍스트 색상 변경 (연하게) */}
      <p className="mt-6 text-sm text-center text-board-dark/70">
        투표 마감:{" "}
        {new Date(meeting.deadline).toLocaleString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}
      </p>
    </Fragment> // Fragment 끝
  );
} // MeetingPage 컴포넌트 끝
