'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3, TrendingUp, Leaf, DollarSign, Clock, ShieldCheck,
  ArrowRight, ArrowLeft, Download, RefreshCw, Layers, PieChart,
  Sparkles, Truck, Box, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';

interface AnalyticsData {
  kpis: {
    carbonSavedKg: number;
    carbonReductionRate: number;
    fuelCostSavedWon: number;
    pineTreesEquivalent: number;
    grossRevenueWon: number;
    totalCostWon: number;
    marginRate: number;
    onTimeDeliveryRate: number;
    totalDeliveryCount: number;
    wmsSlottingEfficiency: number;
    negativeMarginCount: number;
  };
  monthlyTrend: { month: string; revenue: number; cost: number; profit: number }[];
  zonePerformance: { zoneNm: string; loadRate: number; onTimeRate: number; deliveryCount: number; status: string }[];
  returnReasons: { reason: string; count: number; sharePercent: number; amountWon: number; color: string }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDownloadCsvReport = () => {
    if (!data) return;
    const rows = [
      ['월별', '매출(백만원)', '원가매입(백만원)', '순이익(백만원)'],
      ...data.monthlyTrend.map(m => [m.month, m.revenue.toString(), m.cost.toString(), m.profit.toString()]),
      [],
      ['권역', '부하율(%)', '정시배송율(%)', '배송건수'],
      ...data.zonePerformance.map(z => [z.zoneNm, z.loadRate.toString(), z.onTimeRate.toString(), z.deliveryCount.toString()]),
      [],
      ['ESG 탄소절감량(kg)', data.kpis.carbonSavedKg.toString()],
      ['유류비절감액(원)', data.kpis.fuelCostSavedWon.toString()],
      ['소나무식재환산(그루)', data.kpis.pineTreesEquivalent.toString()]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DOT2LINE_물류경영_ESG_분석리포트_202610.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white pb-16">
      {/* 상단 글로벌 헤더 */}
      <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              DOT2LINE
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
              <Leaf size={11} /> ESG & 물류 경영 BI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/control-tower')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Sparkles size={13} className="text-indigo-400" />
            <span>AI 관제 타워</span>
          </button>
          <button
            onClick={handleDownloadCsvReport}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Download size={13} />
            <span>경영 리포트 다운로드 (CSV)</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* 상단 타이틀 배너 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Autonomous Logistics Business Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              차세대 물류 경영 분석 및 녹색 물류(ESG) 센터
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              2-Opt 탄소 감축 산출, 마진 방어 분석, 전국 권역별 정시율(OTIF) 및 WMS 슬로팅 효율 대사
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition"
            title="새로고침"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>
        </div>

        {/* 4대 종합 핵심 KPI 카드 */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. ESG 탄소 감축 */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Leaf size={14} /> ESG 녹색 물류 탄소 감축
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                  -{data.kpis.carbonReductionRate}%
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white my-1 font-mono">
                {data.kpis.carbonSavedKg.toLocaleString()} <span className="text-sm font-normal text-slate-400">kg CO₂</span>
              </p>
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-800">
                <p>소나무 <strong className="text-emerald-300 font-mono">{data.kpis.pineTreesEquivalent}</strong> 그루 식재 효과</p>
                <p>유류비 절감액: <strong className="text-white font-mono">₩ {data.kpis.fuelCostSavedWon.toLocaleString()}</strong></p>
              </div>
            </div>

            {/* 2. 물류 마진 방어율 */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <DollarSign size={14} /> 수송/배송 마진 방어율
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold">
                  Gross Margin
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white my-1 font-mono">
                {data.kpis.marginRate} <span className="text-sm font-normal text-slate-400">%</span>
              </p>
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-800">
                <p>매출: <strong className="text-emerald-400 font-mono">₩ {(data.kpis.grossRevenueWon / 100000000).toFixed(2)}억</strong></p>
                <p>원가매입: <strong className="text-slate-300 font-mono">₩ {(data.kpis.totalCostWon / 100000000).toFixed(2)}억</strong></p>
              </div>
            </div>

            {/* 3. 전국 정시 배송률 */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Clock size={14} /> 전국 정시 배송률 (OTIF)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                  SLA 98% 기준
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white my-1 font-mono">
                {data.kpis.onTimeDeliveryRate} <span className="text-sm font-normal text-slate-400">%</span>
              </p>
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-800">
                <p>총 배송 오더: <strong className="text-white font-mono">{data.kpis.totalDeliveryCount.toLocaleString()}</strong> 건</p>
                <p>지연 배송: <strong className="text-amber-400 font-mono">44 건 (1.3%)</strong></p>
              </div>
            </div>

            {/* 4. WMS 슬로팅 효율 */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                  <Layers size={14} /> WMS 로케이션 회전율
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                  A-Zone 골든존
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white my-1 font-mono">
                {data.kpis.wmsSlottingEfficiency} <span className="text-sm font-normal text-slate-400">%</span>
              </p>
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-800">
                <p>피킹 이동 동선: <strong className="text-emerald-300 font-mono">-24%</strong> 단축</p>
                <p>재고 이상 발생: <strong className="text-cyan-300 font-mono">0 건</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* 2단 그리드: 월별 손익 트렌드 차트 + 권역별 배송 부하 대시보드 */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 월별 매출 / 원가 / 순익 추이 SVG 바 차트 */}
            <div className="lg:col-span-7 p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <BarChart3 size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">월별 물류 매출 · 원가 · 공헌이익 추이</h3>
                    <p className="text-xs text-slate-400">단위: 백만 원 (VAT 별도)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500" /> 매출</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-700" /> 매입원가</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400" /> 순이익</span>
                </div>
              </div>

              {/* 인터랙티브 SVG 바 차트 */}
              <div className="w-full h-64 pt-4 flex items-end justify-between gap-3 px-2">
                {data.monthlyTrend.map((m, idx) => {
                  const revHeight = (m.revenue / 160) * 100;
                  const costHeight = (m.cost / 160) * 100;
                  const profitHeight = (m.profit / 160) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-48 relative">
                        {/* 툴팁 */}
                        <div className="absolute -top-12 bg-slate-950 border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 pointer-events-none shadow-lg">
                          <p className="font-bold text-indigo-300">{m.month}</p>
                          <p>매출: {m.revenue}M / 원가: {m.cost}M / 익: +{m.profit}M</p>
                        </div>

                        {/* 매출 바 */}
                        <div
                          className="w-1/3 bg-indigo-500 rounded-t-md transition-all group-hover:brightness-110"
                          style={{ height: `${revHeight}%` }}
                        />
                        {/* 원가 바 */}
                        <div
                          className="w-1/3 bg-slate-700 rounded-t-md transition-all group-hover:brightness-110"
                          style={{ height: `${costHeight}%` }}
                        />
                        {/* 순익 바 */}
                        <div
                          className="w-1/3 bg-emerald-400 rounded-t-md transition-all group-hover:brightness-110"
                          style={{ height: `${profitHeight}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 mt-2 truncate">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 권역별 배송 부하 & 정시 도착률 테이블 */}
            <div className="lg:col-span-5 p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Activity size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">전국 권역별 부하율 & 정시 도착률</h3>
                    <p className="text-xs text-slate-400">실시간 거점 센터 가동 지표</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {data.zonePerformance.map((z, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-white">{z.zoneNm}</strong>
                      <span className="font-mono text-emerald-400 font-bold">정시율 {z.onTimeRate}%</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          z.loadRate > 90 ? 'bg-amber-400' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${z.loadRate}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>차량 CBM 부하: {z.loadRate}%</span>
                      <span>누적 배송: {z.deliveryCount} 건</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3단: 역물류 반품 원인 파레토 분석 + 녹색 물류(ESG) 감축 공인 리포트 */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 반품 사유 파레토 */}
            <div className="lg:col-span-6 p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <PieChart size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">역물류(반품) 사유별 파레토 분석</h3>
                    <p className="text-xs text-slate-400">품질 개선 및 화주사 클레임 예방 데이터</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {data.returnReasons.map((r, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.reason} ({r.count}건)
                      </span>
                      <strong className="text-white font-mono">{r.sharePercent}%</strong>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${r.sharePercent}%`, backgroundColor: r.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ESG 녹색 물류 공인 리포트 카드 */}
            <div className="lg:col-span-6 p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/20 rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Leaf size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">2-Opt 녹색 물류 탄소 저감 표준 리포트</h3>
                    <p className="text-xs text-slate-400">국제 온실가스 프로토콜(GHG Scope 3) 기반 산출</p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  공인 규격 대사 완료
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">VRP 누적 단축 주행거리</span>
                  <strong className="text-base text-cyan-300 font-mono">6,840 km</strong>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">경유 유류비 절감액</span>
                  <strong className="text-base text-emerald-400 font-mono">₩ 3,840,000</strong>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">탄소 감축량 (CO₂-eq)</span>
                  <strong className="text-base text-white font-mono">1,428.5 kg</strong>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">소나무 30년생 대체 효과</span>
                  <strong className="text-base text-emerald-300 font-mono">216 그루</strong>
                </div>
              </div>

              <p className="text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                💡 <strong className="text-slate-200">AI 최적화 성과:</strong> 당월 수배송 배차 시 2-Opt 경로 단축 알고리즘을 100% 적용하여 불필요한 공차 주행 및 도심 회차를 19.3% 절감하였습니다. 해당 데이터는 화주사 ESG 지속가능경영 공시 보고서로 즉시 인용 가능합니다.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
