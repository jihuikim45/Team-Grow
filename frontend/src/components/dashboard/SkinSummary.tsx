'use client';

import * as React from 'react';
import { Star, Droplets } from 'lucide-react';
import BaumannAnalysis from './BaumannAnalysis';

type AxisKey = 'OD' | 'SR' | 'PN' | 'WT';

interface SkinSummaryProps {
  code: string;
  koAxisWord: Record<AxisKey, string>;
  concerns: { key: AxisKey; label: string; value: number; displayValue?: number }[];
  pick: { OD: string; SR: string; PN: string; WT: string };
  onNavigate?: (page: string) => void;
}

/** 라벨 매핑 (왼쪽 고정) */
const LEFT_LABEL: Record<AxisKey, string> = {
  OD: 'OILY',
  SR: 'SENSITIVE',
  PN: 'PIGMENTED',
  WT: 'WRINKLED',
};

/** 라벨 매핑 (오른쪽 고정) */
const RIGHT_LABEL: Record<AxisKey, string> = {
  OD: 'DRY',
  SR: 'RESISTANCE',
  PN: 'NON-PIGMENTED',
  WT: 'TIGHT',
};

/** 축별 칩/바 컬러 */
const AXIS_COLOR: Record<
  AxisKey,
  { main: string; soft: string; leftBar: string; rightBar: string }
> = {
  OD: {
    main: '#06b6d4',
    soft: 'rgba(6,182,212,0.15)',
    leftBar: '#06b6d4',
    rightBar: '#67e8f9',
  },
  SR: {
    main: '#f472b6',
    soft: 'rgba(244,114,182,0.18)',
    leftBar: '#f472b6',
    rightBar: '#fbcfe8',
  },
  PN: {
    main: '#a78bfa',
    soft: 'rgba(167,139,250,0.18)',
    leftBar: '#a78bfa',
    rightBar: '#d8b4fe',
  },
  WT: {
    main: '#34d399',
    soft: 'rgba(52,211,153,0.18)',
    leftBar: '#34d399',
    rightBar: '#86efac',
  },
};

export default function SkinSummary({
  pick,
  onNavigate,
  code,
  koAxisWord,
  concerns,
}: SkinSummaryProps) {
  // 칩 데이터
  const chips = [
    { key: 'OD' as AxisKey, text: koAxisWord.OD, color: AXIS_COLOR.OD },
    { key: 'SR' as AxisKey, text: koAxisWord.SR, color: AXIS_COLOR.SR },
    { key: 'PN' as AxisKey, text: koAxisWord.PN, color: AXIS_COLOR.PN },
    { key: 'WT' as AxisKey, text: koAxisWord.WT, color: AXIS_COLOR.WT },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-4 sm:p-6">
      {/* 헤더 */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 text-pink-500">
            <Star size={18} />
          </span>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">내 피부 MBTI</h2>
        </div>
        <p className="text-sm text-gray-500 mt-2 pl-[2.5rem]">
          최근 진단을 기반으로 한 바우만 타입과 주요 축 지표입니다.
        </p>
      </div>

      {/* 타입 + 축 칩 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-10 mb-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 text-pink-500">
            <Droplets size={18} />
          </span>
          <p className="text-lg sm:text-xl font-semibold text-gray-800">
            <span className="text-pink-500">{code}</span>
          </p>
        </div>

        {/* 4축 칩 */}
        <div className="flex flex-wrap gap-2 ml-[2.5rem] sm:ml-0">
          {chips.map(c => (
            <span
              key={c.key}
              className="px-2.5 py-1 text-xs rounded-full font-medium"
              style={{
                color: c.color.main,
                background: c.color.soft,
                border: `1px solid ${c.color.main}22`,
              }}
            >
              {c.text}
            </span>
          ))}
        </div>
      </div>

      {/* 중앙 기준 양방향 바 */}
      <div className="space-y-3 mt-2">
        {concerns.map(c => {
          const value = Math.max(0, Math.min(100, c.value ?? 50));
          const displayValue = c.displayValue ?? value;
          const neutral = 50;
          const deviation = value - neutral;

          const axisColor = AXIS_COLOR[c.key];
          const leftExtend = Math.max(0, deviation);
          const rightExtend = Math.max(0, -deviation);
          const barColor = deviation >= 0 ? axisColor.leftBar : axisColor.rightBar;

          return (
            <div key={c.key}>
              {/* 라벨 행 */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium text-gray-700">{LEFT_LABEL[c.key]}</span>
                <span className="text-[13px] font-medium text-gray-700">{RIGHT_LABEL[c.key]}</span>
              </div>

              {/* 바 컨테이너 */}
              <div className="relative w-full h-4 rounded-full overflow-hidden bg-gray-100">
                {/* 왼쪽으로 뻗는 바 */}
                {deviation >= 0 && (
                  <div
                    className="absolute top-0 h-full transition-all duration-500 ease-out"
                    style={{
                      right: '50%',
                      width: `${leftExtend}%`,
                      background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}dd 70%, ${barColor}aa 100%)`,
                    }}
                  />
                )}

                {/* 오른쪽으로 뻗는 바 */}
                {deviation < 0 && (
                  <div
                    className="absolute top-0 h-full transition-all duration-500 ease-out"
                    style={{
                      left: '50%',
                      width: `${rightExtend}%`,
                      background: `linear-gradient(90deg, ${barColor}aa 0%, ${barColor}dd 30%, ${barColor} 100%)`,
                    }}
                  />
                )}

                {/* 중앙선 */}
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-400 -translate-x-1/2 z-10"></div>

                {/* 퍼센트 표시 */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="text-[11px] font-bold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded">
                    {displayValue}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 바우만 분석 - 하단 배치 */}
      <div className="mt-6">
        <BaumannAnalysis pick={pick} code={code} koAxisWord={koAxisWord} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
