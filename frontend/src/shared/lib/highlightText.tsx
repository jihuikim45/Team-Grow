import React from 'react';

/**
 * 검색어를 하이라이트 처리하는 함수
 * @param text - 원본 텍스트
 * @param query - 검색어 (공백으로 여러 키워드 분리 가능)
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text;

  // 공백으로 분리된 키워드들을 OR 패턴으로 변환
  // "미백 효과" → /(미백|효과)/gi
  const keywords = query.trim().split(/\s+/).filter(Boolean);
  const pattern = new RegExp(`(${keywords.map(escapeRegex).join('|')})`, 'gi');

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isMatch = keywords.some(
      (kw) => part.toLowerCase() === kw.toLowerCase()
    );
    return isMatch ? (
      <mark
        key={i}
        className="bg-pink-200 text-pink-800 rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    );
  });
}

// 정규식 특수문자 이스케이프
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
