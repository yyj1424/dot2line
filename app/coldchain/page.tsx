'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ThermometerSnowflake, Thermometer, Droplets, AlertTriangle, ShieldCheck,
  Download, RefreshCw, Radio, Activity, ArrowLeft, Truck, Box,
  CheckCircle2, Zap, ArrowRight, ShieldAlert, Sparkles, MapPin, Eye
} from 'lucide-react';

interface SensorItem {
  id: string;
  targetType: 'VEHICLE' | 'WAREHOUSE';
  targetName: string;
  driverNm: string;
  type: 'COLD' | 'FROZEN';
  typeNm: string;
  currentTemp: number;
  targetTemp: number;
  humidity: number;
  doorStatus: 'OPEN' | 'CLOSED';
  compressorStatus: 'RUNNING' | 'BOOST_REQUIRED' | 'STANDBY';
  status: 'OPTIMAL' | 'CRITICAL' | 'WARNING';
  location: string;
  lastUpdated: string;
}

interface ColdChainData {
  updatedAt: string;
  summary: {
    totalMonitoredVehicles: number;
    normalCount: number;
    alertCount: number;
    averageColdTemp: number;
    averageFrozenTemp: number;
    kfdaComplianceRate: number;
  };
  activeSensors: SensorItem[];
  temperatureTimeline: { time: string; tempCold: number; tempFrozen: number }[];
}

export default function ColdChainPage() {
  const router = useRouter();
  const [data, setData] = useState<ColdChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [remoteBoosting, setRemoteBoosting] = useState(false);
  const [boostedVehicles, setBoostedVehicles] = useState<string[]>([]);

  const fetchColdChain = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coldchain');
      const json = await res.json();
      setData(json);
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColdChain();
    const interval = setInterval(fetchColdChain, 10000); // 10초 주기 실시간 갱신
    return () => clearInterval(interval);
  }, []);

  const handleRemoteBoost = (sensorId: string) => {
    setRemoteBoosting(true);
    setTimeout(() => {
      setRemoteBoosting(false);
      setBoostedVehicles(prev => [...prev, sensorId]);
      alert(`[원격 지시 완료] 차량(${sensorId}) 냉동 콤프레셔 터보 부스트 가동 명령이 LTE-M IoT 모뎀으로 전송되었습니다.`);
      if (data) {
        setData({
          ...data,
          summary: { ...data.summary, alertCount: 0 },
          activeSensors: data.activeSensors.map(s =>
            s.id === sensorId
              ? { ...s, currentTemp: 4.2, status: 'OPTIMAL', compressorStatus: 'RUNNING' }
              : s
          ),
        });
      }
    }, 1000);
  };

  const handleDownloadTachometerCert = () => {
    if (!data) return;
    const rows = [
      ['[식품의약품안전처 정온 물류 운행 준수 인증 기록증]'],
      ['발급일자', new Date().toISOString().slice(0, 10)],
      ['발급기관', 'DOT2LINE Autonomous Logistics Cold-Chain Division'],
      ['전체 정온 준수율', `${data.summary.kfdaComplianceRate}%`],
      [],
      ['센서ID', '구분', '차량/로케이션', '현재온도(℃)', '설정온도(℃)', '습도(%)', '도어상태', '위치'],
      ...data.activeSensors.map(s => [
        s.id,
        s.typeNm,
        s.targetName,
        s.currentTemp.toString(),
        s.targetTemp.toString(),
        `${s.humidity}%`,
        s.doorStatus,
        s.location,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `식약처_정온유지_타코메타기록증_20261007.csv`);
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
            <Link href="/" className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              DOT2LINE
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold flex items-center gap-1">
              <ThermometerSnowflake size={11} /> 스마트 콜드체인 & IoT 정온 관제
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
            onClick={handleDownloadTachometerCert}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95"
          >
            <Download size={13} />
            <span>식약처 온도기록증 다운로드</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* 상단 타이틀 배너 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Real-Time Telemetry & Cold-Chain Guard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              실시간 콜드체인 IoT 온·습도 관제 & KFDA 타코메타 센터
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              냉장·냉동 특장 차량 및 물류센터 정온 보관고 5초 주기 무선 온습도 스트리밍 및 적정온도 이탈 방지
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">최근 대사: {data?.updatedAt || '09:40'}</span>
            <button
              onClick={fetchColdChain}
              disabled={loading}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition"
              title="새로고침"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-cyan-400' : ''} />
            </button>
          </div>
        </div>

        {/* 4대 최상단 정온 KPI 카드 */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Radio size={14} className="animate-pulse" /> 감시중인 정온 자산
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                  IoT 100% 가동
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white my-1 font-mono">
                {data.summary.totalMonitoredVehicles} <span className="text-sm font-normal text-slate-400">대 / 개소</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                정상 운행 <strong className="text-emerald-400 font-mono">{data.summary.normalCount}</strong>건 / 경보 <strong className="text-rose-400 font-mono">{data.summary.alertCount}</strong>건
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Thermometer size={14} /> 실시간 평균 냉장 온도
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold">
                  0℃ ~ 5℃
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 my-1 font-mono">
                +{data.summary.averageColdTemp} <span className="text-sm font-normal text-slate-400">℃</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                수도권 신선식품 적정 규격 유지중
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-950/30 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                  <ThermometerSnowflake size={14} /> 실시간 평균 냉동 온도
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 font-bold">
                  -25℃ ~ -18℃
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-cyan-300 my-1 font-mono">
                {data.summary.averageFrozenTemp} <span className="text-sm font-normal text-slate-400">℃</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                초저온 냉동고 기준치 완벽 충족
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> 식약처(KFDA) 규격 준수율
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                  의무 제출 공인
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white my-1 font-mono">
                {data.summary.kfdaComplianceRate} <span className="text-sm font-normal text-slate-400">%</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                타코메타 온도 이탈율 0.6% 미만
              </p>
            </div>
          </div>
        )}

        {/* 온도 이탈 긴급 경보 카드 (발생 시 즉각 원격 냉각 지시 버튼 제공) */}
        {data && data.activeSensors.some(s => s.status === 'CRITICAL' && !boostedVehicles.includes(s.id)) && (
          <div className="p-4 sm:p-5 bg-rose-950/30 border border-rose-500/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    [적정 온도 초과 경보] 3호차 (인천89사4321) +7.8℃ 도달
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    도어 12분 개방
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  인천 송도 하역장에서 장시간 도어 개방으로 냉장 상한선(5.0℃)을 초과했습니다. 냉동기 강제 가동이 시급합니다.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleRemoteBoost('SEN-VEH-03')}
              disabled={remoteBoosting}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 shrink-0"
            >
              <Zap size={14} className={remoteBoosting ? 'animate-spin' : ''} />
              <span>{remoteBoosting ? 'LTE-M 명령 전송중...' : '냉동기 터보 부스트 원격 가동 지시'}</span>
            </button>
          </div>
        )}

        {/* 2단 그리드: 실시간 온도 추이 SVG 차트 + 센서 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 시간대별 온도 추이 SVG 차트 */}
          <div className="lg:col-span-6 p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Activity size={16} />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">24시간 연속 온도 타코메타 기록 곡선</h3>
                  <p className="text-xs text-slate-400">냉장(+2℃ 기준) 및 냉동(-20℃ 기준) 궤적</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400" /> 냉장</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-400" /> 냉동</span>
              </div>
            </div>

            {/* SVG 차트 캔버스 */}
            <div className="w-full h-64 bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 relative flex flex-col justify-between">
              {/* 상한/하한 안전 가이드선 */}
              <div className="absolute inset-x-4 top-1/4 border-b border-dashed border-emerald-500/20 flex justify-between text-[9px] text-emerald-400 font-mono">
                <span>냉장 상한선 (+5.0℃)</span>
              </div>
              <div className="absolute inset-x-4 bottom-1/4 border-b border-dashed border-cyan-500/20 flex justify-between text-[9px] text-cyan-400 font-mono">
                <span>냉동 하한선 (-18.0℃)</span>
              </div>

              {/* 시간대별 꺾은선 차트 시각화 */}
              <svg className="w-full h-44 overflow-visible" viewBox="0 0 400 160">
                {/* 냉장 라인 (초록) */}
                <path
                  d="M 20 60 Q 80 55, 140 50 T 200 35 T 260 52 T 320 54 T 380 50"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
                {/* 냉동 라인 (시안) */}
                <path
                  d="M 20 135 Q 80 132, 140 130 T 200 125 T 260 131 T 320 130 T 380 128"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
                {/* 데이터 포인트 */}
                {[20, 80, 140, 200, 260, 320, 380].map((cx, i) => (
                  <g key={i}>
                    <circle cx={cx} cy={i === 3 ? 35 : 52} r="3.5" fill="#10b981" />
                    <circle cx={cx} cy={130} r="3.5" fill="#06b6d4" />
                  </g>
                ))}
              </svg>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-900">
                <span>04:00</span>
                <span>05:00</span>
                <span>06:00</span>
                <span>07:00 (상차)</span>
                <span>08:00</span>
                <span>09:00</span>
                <span>10:00</span>
              </div>
            </div>
          </div>

          {/* 실시간 IoT 센서 모니터링 목록 */}
          <div className="lg:col-span-6 p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Radio size={16} />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">정온 자산별 실시간 센서 텔레메트리</h3>
                  <p className="text-xs text-slate-400">도어 개폐, 콤프레셔 가동, GPS 위치</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {data?.activeSensors.map((s) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-xl border transition ${
                    s.status === 'CRITICAL'
                      ? 'bg-rose-950/30 border-rose-500/50'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-white">{s.targetName}</strong>
                        <span className="text-[10px] font-mono text-slate-400">({s.typeNm})</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} className="text-indigo-400" /> {s.location}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-base font-bold font-mono ${
                          s.status === 'CRITICAL' ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                        }`}
                      >
                        {s.currentTemp > 0 ? `+${s.currentTemp}` : s.currentTemp}℃
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">습도 {s.humidity}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          s.doorStatus === 'OPEN' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                        }`}
                      />
                      도어: <strong className={s.doorStatus === 'OPEN' ? 'text-amber-400' : 'text-slate-300'}>{s.doorStatus}</strong>
                    </span>

                    <span className="font-mono">콤프레셔: {s.compressorStatus}</span>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        s.status === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {s.status === 'CRITICAL' ? '온도이탈 (경보)' : '정상 정온 유지'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
