import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { API_BASE } from '../../lib/env';
import FourAxisSummary from './FourAxisSummary';

type Interval = 'all';
type Gender = 'all' | 'female' | 'male' | 'other' | 'na';
type AgeBand = 'all' | '10s' | '20s' | '30s' | '40s' | '50s' | '60s_plus';

interface DistItem {
  type: string;
  count: number;
}
interface DistResp {
  total: number;
  unassigned: number;
  distribution: DistItem[];
  interval: Interval;
  gender: Gender;
  age_band: AgeBand;
}

interface Props {
  interval: Interval;
  gender: Gender;
  ageBand: AgeBand;
  className?: string;
  framed?: boolean;
  userTypeCode?: string;
  filterBar?: React.ReactNode; // 필터 바 (Dashboard에서 전달)
}

/** 메인 팔레트(진한색) */
const TYPE_COLOR: Record<string, string> = {
  OSNT: '#f472b6',
  OSNW: '#fb7185',
  OSPT: '#e879f9',
  OSPW: '#c084fc',
  ORNT: '#f43f5e',
  ORNW: '#f97316',
  ORPT: '#d946ef',
  ORPW: '#a78bfa',
  DSNT: '#60a5fa',
  DSNW: '#38bdf8',
  DSPT: '#34d399',
  DSPW: '#10b981',
  DRNT: '#22c55e',
  DRNW: '#84cc16',
  DRPT: '#06b6d4',
  DRPW: '#14b8a6',
};

/** HEX → rgba */
function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 차트는 연~한 파스텔 톤으로(배지와 톤 매칭) */
function softFill(hex: string) {
  return hexToRgba(hex, 0.6); // 살짝 연하게
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-[96vw] max-w-3xl rounded-2xl bg-white shadow-xl">
        <header className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm border hover:bg-gray-50"
          >
            닫기
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function TypeBadge({ label, pct, color }: { label: string; pct: number; color: string }) {
  // 배지는 부드러운 배경 + 본색 텍스트/점
  return (
    <div
      className="px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm"
      style={{
        background: hexToRgba(color, 0.12),
        border: `1px solid ${hexToRgba(color, 0.28)}`,
      }}
      title={`${label} ${pct}%`}
    >
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm font-medium" style={{ color }}>
        {label}
      </span>
      <span className="text-xs text-gray-600">{pct}%</span>
    </div>
  );
}

export default function SkinTypeStatsPanel({
  interval,
  gender,
  ageBand,
  className,
  framed = true,
  userTypeCode,
  filterBar,
}: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<DistResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = `${API_BASE}/api/stats/baumann-distribution?interval=${interval}&gender=${gender}&age_band=${ageBand}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: DistResp = await res.json();
        if (alive) setData(json);
      } catch (e: any) {
        if (alive) setErr(e.message ?? 'fetch failed');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [interval, gender, ageBand]);

  // 시리즈 계산(%) — 0건인 타입은 자연스럽게 제외 → 16개 모두 있으면 16조각까지 표시됨
  const series = useMemo(() => {
    if (!data || data.total === 0) return [];
    const base = data.distribution
      .filter(d => d.count > 0)
      .map(d => ({
        name: d.type,
        value: +((d.count / data.total) * 100).toFixed(2),
        color: TYPE_COLOR[d.type] ?? '#9ca3af',
        soft: softFill(TYPE_COLOR[d.type] ?? '#9ca3af'),
      }));
    // 비율 내림차순 정렬 → 가장 큰 조각이 먼저
    base.sort((a, b) => b.value - a.value);
    return base;
  }, [data]);

  // 현재 사용자 피부타입 정보 (코드 + 비율 + index)
  const userTypeInfo = useMemo(() => {
    if (!userTypeCode) return null;
    const code = userTypeCode.toUpperCase();
    const idx = series.findIndex(s => s.name === code);
    if (idx === -1) return null;
    return {
      index: idx,
      code,
      pct: Math.round(series[idx].value),
    };
  }, [series, userTypeCode]);

  // TOP3 + 기타(배지)
  const top3PlusOthers = useMemo(() => {
    const sorted = [...series].sort((a, b) => b.value - a.value);
    const top3 = sorted.slice(0, 3);
    const othersPct = Math.max(0, +(100 - top3.reduce((s, x) => s + x.value, 0)).toFixed(2));
    const items = top3.map(i => ({
      label: i.name,
      pct: Math.round(i.value),
      color: i.color,
    }));
    // if (othersPct > 0) items.push({ label: '기타', pct: Math.round(othersPct), color: '#94a3b8' });
    return items;
  }, [series]);

  return (
    <div className={className}>
      {/* 본체 (frameless 옵션) */}
      <div className={framed ? 'rounded-2xl border border-[#0000000d] bg-white p-4 sm:p-6' : ''}>
        {/* 상위 타입 + 버튼 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold text-gray-800">상위 타입</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {top3PlusOthers.map(b => (
              <TypeBadge
                key={b.label}
                label={b.label}
                pct={b.pct}
                color={TYPE_COLOR[b.label] ?? '#94a3b8'}
              />
            ))}
          </div>
        </div>

        {/* 필터 바 (상위 타입 아래) */}
        {filterBar && <div className="mb-3">{filterBar}</div>}

        {/* <div className="text-sm text-gray-500 mb-3">
          보기 조건 — 성별: <b>{gender}</b>, 연령대: <b>{ageBand}</b>
        </div> */}

        {loading && <div className="text-sm text-gray-500">불러오는 중…</div>}
        {err && <div className="text-sm text-red-500">데이터 오류: {err}</div>}

        {!loading && !err && data && (
          <>
            {data.total === 0 ? (
              <div className="h-64 flex items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
                표본 수가 부족합니다.
              </div>
            ) : (
              <>
                {/* 가로 바 차트 */}
                <div className="h-[530px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={series}
                      layout="vertical"
                      margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                    >
                      <XAxis
                        type="number"
                        domain={[0, 'dataMax']}
                        tickFormatter={v => `${v}%`}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={55}
                        tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
                      />
                      <Tooltip
                        formatter={(v: number) => [`${v}%`, '비율']}
                        contentStyle={{
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                        {series.map((s, i) => (
                          <Cell
                            key={i}
                            fill={s.soft}
                            stroke={s.color}
                            strokeWidth={userTypeCode?.toUpperCase() === s.name ? 2 : 0}
                          />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="right"
                          content={(props: any) => {
                            const { x, y, width, value, index } = props;
                            const item = series[index];
                            const isUserType = userTypeCode?.toUpperCase() === item?.name;
                            return (
                              <text
                                x={x + width + 8}
                                y={y}
                                dy={12}
                                fontSize={11}
                                fill={isUserType ? (item?.color ?? '#06b6d4') : '#6b7280'}
                                textAnchor="start"
                              >
                                {Math.round(value)}%
                              </text>
                            );
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            <div className="mt-4 text-xs text-gray-500">
              사용자 전체: <b>{data.total.toLocaleString()}명</b>
              {data.unassigned ? <> · 미설정: {data.unassigned.toLocaleString()}</> : null}
            </div>
          </>
        )}
      </div>

      {/* 모달(4축 요약) */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="내 MBTI는 상위 몇 %? (OD / SR / PN / WT)"
      >
        <FourAxisSummary interval="all" gender={gender} ageBand={ageBand} />
      </Modal>
    </div>
  );
}
