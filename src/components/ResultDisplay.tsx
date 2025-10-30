"use client";

import { useEffect, useState } from "react";

// Props 타입 정의
interface ResultDisplayProps {
  meetingId: string;
  dateOptions: { _id: string; date: string }[]; // 날짜 정보 매핑을 위해 필요
}

// API 응답 타입 정의
interface VoteResults {
  [dateOptionId: string]: number; // { "optionId1": 3, "optionId2": 5 }
}
interface VoterInfo {
  participantId: string;
  nickname: string;
}

export default function ResultDisplay({
  meetingId,
  dateOptions,
}: ResultDisplayProps) {
  // 상태 변수 정의
  const [results, setResults] = useState<VoteResults | null>(null); // 전체 투표 결과 (득표 수)
  const [loadingResults, setLoadingResults] = useState(true); // 결과 로딩 상태
  const [errorResults, setErrorResults] = useState<string | null>(null); // 결과 로딩 에러

  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null); // 현재 펼쳐진 날짜 옵션 ID
  const [voters, setVoters] = useState<VoterInfo[]>([]); // 특정 날짜 투표자 목록
  const [loadingVoters, setLoadingVoters] = useState(false); // 투표자 목록 로딩 상태
  const [errorVoters, setErrorVoters] = useState<string | null>(null); // 투표자 목록 로딩 에러

  // 날짜 ID를 실제 날짜 문자열로 빠르게 찾기 위한 Map 객체
  const dateMap = new Map(dateOptions.map((opt) => [opt._id, opt.date]));

  // 1. 컴포넌트 마운트 시 전체 투표 결과 (득표 수) 가져오는 useEffect
  useEffect(() => {
    const fetchResults = async () => {
      setLoadingResults(true); // 로딩 시작
      setErrorResults(null); // 에러 초기화
      try {
        // 백엔드 API 호출 (rewrites 경로 사용)
        const response = await fetch(`/api/be/meetings/${meetingId}/votes`);
        if (!response.ok) {
          // 응답 실패 시 에러 발생
          throw new Error("투표 결과를 불러오는데 실패했습니다.");
        }
        const data: VoteResults = await response.json(); // 응답 데이터 파싱
        setResults(data); // 상태 업데이트
      } catch (err: unknown) {
        // 에러 처리
        setErrorResults(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        setLoadingResults(false); // 로딩 종료 (성공/실패 무관)
      }
    };
    fetchResults(); // 함수 실행
  }, [meetingId]); // meetingId가 변경될 때만 이 effect를 다시 실행

  // 2. 특정 날짜 옵션 클릭 시 해당 날짜 투표자 목록 가져오는 함수
  const fetchVoters = async (optionId: string) => {
    // 이미 열려있는 항목을 다시 클릭하면 닫기
    if (expandedOptionId === optionId) {
      setExpandedOptionId(null); // 펼쳐진 ID 초기화
      setVoters([]); // 투표자 목록 비우기
      return; // 함수 종료
    }

    setExpandedOptionId(optionId); // 새로 클릭한 항목 ID 저장
    setLoadingVoters(true); // 투표자 로딩 시작
    setErrorVoters(null); // 에러 초기화
    setVoters([]); // 이전 목록 초기화

    try {
      // 백엔드 API 호출 (rewrites 경로 사용)
      const response = await fetch(
        `/api/be/meetings/${meetingId}/votes/${optionId}`
      );
      if (!response.ok) {
        // 응답 실패 시 에러 발생
        throw new Error("투표자 목록을 불러오는데 실패했습니다.");
      }
      const data: VoterInfo[] = await response.json(); // 응답 데이터 파싱
      setVoters(data); // 상태 업데이트
    } catch (err: unknown) {
      // 에러 처리
      setErrorVoters(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoadingVoters(false); // 로딩 종료
    }
  };

  // --- 렌더링 로직 시작 ---

  // 전체 결과 로딩 중일 때 표시
  if (loadingResults)
    return <p className="text-center text-board-dark/70">결과 로딩 중...</p>;
  // 전체 결과 로딩 에러 시 표시
  if (errorResults)
    return <p className="text-center text-red-600">오류: {errorResults}</p>;
  // 결과 데이터가 없을 때 표시
  if (!results)
    return (
      <p className="text-center text-board-dark/70">결과 데이터가 없습니다.</p>
    );

  // 결과를 득표 수 기준으로 내림차순 정렬
  const sortedOptions = Object.entries(results) // 객체를 [ [id, count], ... ] 배열로 변환
    .sort(([, countA], [, countB]) => countB - countA) // count 값 기준으로 내림차순 정렬
    .map(([optionId, count]) => ({ optionId, count })); // 다시 { optionId, count } 객체 배열로 변환

  // 최종 UI 렌더링
  return (
    // 카드 스타일: 배경 light, 테두리 secondary, 그림자 md, 텍스트 dark
    <div className="w-full p-6 bg-board-light border border-board-secondary rounded-lg shadow-md text-board-dark">
      <h3 className="text-xl font-semibold mb-5 text-center">투표 결과</h3>
      <div className="space-y-3">
        {" "}
        {/* 각 날짜 항목 사이 간격 */}
        {sortedOptions.map(({ optionId, count }) => (
          // 각 날짜 결과 카드
          <div
            key={optionId}
            className="bg-white border border-board-secondary/30 p-3 rounded-md shadow-sm"
          >
            {" "}
            {/* 배경 white, 테두리 연하게, 그림자 sm */}
            {/* 날짜 및 득표 수 표시 영역 (클릭 가능) */}
            <div
              className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-0.8 rounded transition-colors duration-200" // 호버 효과
              onClick={() => fetchVoters(optionId)} // 클릭 시 fetchVoters 함수 호출
            >
              {/* 날짜 텍스트 */}
              <span className="text-sm">
                {new Date(dateMap.get(optionId) || "").toLocaleDateString(
                  "ko-KR",
                  {
                    // dateMap에서 날짜 찾아 표시
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                    hour: "numeric",
                    minute: "numeric",
                  }
                )}
              </span>
              {/* 득표 수 */}
              <span className="text-lg font-bold text-board-accent-gold">
                {count} 표
              </span>{" "}
              {/* 색상 accent-gold */}
            </div>
            {/* --- 펼쳐진 항목의 투표자 목록 표시 영역 --- */}
            {expandedOptionId === optionId && ( // 현재 클릭된 항목일 때만 내용 표시
              <div className="mt-2 pl-4 border-l-2 border-board-secondary/50">
                {" "}
                {/* 왼쪽에 구분선 */}
                {/* 투표자 목록 로딩 중 표시 */}
                {loadingVoters && (
                  <p className="text-xs text-board-dark/70">
                    투표자 로딩 중...
                  </p>
                )}
                {/* 투표자 목록 로딩 에러 표시 */}
                {errorVoters && (
                  <p className="text-xs text-red-600">오류: {errorVoters}</p>
                )}
                {/* 로딩 완료 & 투표자 없을 때 표시 */}
                {!loadingVoters && voters.length === 0 && !errorVoters && (
                  <p className="text-xs text-board-dark/70">
                    투표자가 없습니다.
                  </p>
                )}
                {/* 로딩 완료 & 투표자 있을 때 목록 표시 */}
                {!loadingVoters && voters.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {voters.map((voter) => (
                      <li
                        key={voter.participantId}
                        className="text-xs text-board-dark/90"
                      >
                        {voter.nickname}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {/* --- 투표자 목록 표시 영역 끝 --- */}
          </div> // 각 날짜 결과 카드 끝
        ))}
      </div>
    </div> // 전체 컴포넌트 div 끝
  );
}
