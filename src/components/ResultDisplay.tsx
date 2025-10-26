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
  const [results, setResults] = useState<VoteResults | null>(null);
  const [loadingResults, setLoadingResults] = useState(true);
  const [errorResults, setErrorResults] = useState<string | null>(null);

  // 특정 날짜의 투표자 목록 상태 (펼쳐진 항목 관리)
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [voters, setVoters] = useState<VoterInfo[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [errorVoters, setErrorVoters] = useState<string | null>(null);

  // 날짜 ID를 실제 날짜 문자열로 변환하기 위한 Map 생성
  const dateMap = new Map(dateOptions.map((opt) => [opt._id, opt.date]));

  // 1. 컴포넌트 마운트 시 전체 투표 결과 (득표 수) 가져오기
  useEffect(() => {
    const fetchResults = async () => {
      setLoadingResults(true);
      setErrorResults(null);
      try {
        const response = await fetch(`/api/be/meetings/${meetingId}/votes`);
        if (!response.ok)
          throw new Error("투표 결과를 불러오는데 실패했습니다.");
        const data: VoteResults = await response.json();
        setResults(data);
      } catch (err: unknown) {
        setErrorResults(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        setLoadingResults(false);
      }
    };
    fetchResults();
  }, [meetingId]); // meetingId가 변경될 때만 다시 호출

  // 2. 특정 날짜 클릭 시 해당 날짜 투표자 목록 가져오기
  const fetchVoters = async (optionId: string) => {
    // 이미 열려있는 항목을 다시 클릭하면 닫기
    if (expandedOptionId === optionId) {
      setExpandedOptionId(null);
      setVoters([]);
      return;
    }

    setExpandedOptionId(optionId); // 클릭한 항목 ID 저장
    setLoadingVoters(true);
    setErrorVoters(null);
    setVoters([]); // 이전 목록 초기화

    try {
      const response = await fetch(
        `/api/be/meetings/${meetingId}/votes/${optionId}`
      );
      if (!response.ok)
        throw new Error("투표자 목록을 불러오는데 실패했습니다.");
      const data: VoterInfo[] = await response.json();
      setVoters(data);
    } catch (err: unknown) {
      setErrorVoters(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoadingVoters(false);
    }
  };

  // --- 렌더링 로직 ---
  if (loadingResults)
    return <p className="text-center text-gray-400">결과 로딩 중...</p>;
  if (errorResults)
    return <p className="text-center text-red-400">오류: {errorResults}</p>;
  if (!results)
    return <p className="text-center text-gray-400">결과 데이터가 없습니다.</p>;

  // 결과를 득표 수 기준으로 내림차순 정렬
  const sortedOptions = Object.entries(results) // [ [optionId, count], ... ]
    .sort(([, countA], [, countB]) => countB - countA) // count 기준으로 내림차순 정렬
    .map(([optionId, count]) => ({ optionId, count }));

  return (
    <div className="w-full p-6 bg-gray-700 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-5 text-center text-white">
        투표 결과
      </h3>
      <div className="space-y-3">
        {sortedOptions.map(({ optionId, count }) => (
          <div key={optionId} className="bg-gray-600 p-3 rounded-md">
            <div
              className="flex justify-between items-center cursor-pointer hover:bg-gray-500 p-1 rounded"
              onClick={() => fetchVoters(optionId)} // 클릭 시 투표자 목록 로드
            >
              <span className="text-sm text-white">
                {new Date(dateMap.get(optionId) || "").toLocaleDateString(
                  "ko-KR",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                    hour: "numeric",
                    minute: "numeric",
                  }
                )}
              </span>
              <span className="text-lg font-bold text-blue-300">
                {count} 표
              </span>
            </div>

            {/* 펼쳐진 항목의 투표자 목록 표시 */}
            {expandedOptionId === optionId && (
              <div className="mt-2 pl-4 border-l-2 border-gray-500">
                {loadingVoters && (
                  <p className="text-xs text-gray-400">투표자 로딩 중...</p>
                )}
                {errorVoters && (
                  <p className="text-xs text-red-400">오류: {errorVoters}</p>
                )}
                {!loadingVoters && voters.length === 0 && !errorVoters && (
                  <p className="text-xs text-gray-400">투표자가 없습니다.</p>
                )}
                {!loadingVoters && voters.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {voters.map((voter) => (
                      <li
                        key={voter.participantId}
                        className="text-xs text-gray-300"
                      >
                        {voter.nickname}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
