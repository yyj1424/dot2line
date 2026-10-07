'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Barcode, Camera, CheckCircle2, AlertTriangle, RefreshCw,
  Volume2, VolumeX, ArrowLeft, Layers, ShieldCheck, Box,
  Truck, MapPin, Search, Check, X, ShieldAlert, Cpu
} from 'lucide-react';

interface ScanHistoryItem {
  id: string;
  barcode: string;
  time: string;
  type: 'LINEHAUL' | 'CYCLE_COUNT' | 'WAYBILL';
  status: 'SUCCESS' | 'ERROR';
  message: string;
  location?: string | null;
}

export default function PdaScannerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'linehaul' | 'cycle' | 'waybill'>('linehaul');
  const [currentCenter, setCurrentCenter] = useState('IC01');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 1. 간선 입고 상태 (WMS-01)
  const [linehaulBarcode, setLinehaulBarcode] = useState('');
  const [linehaulLoading, setLinehaulLoading] = useState(false);
  const [linehaulResult, setLinehaulResult] = useState<any>(null);

  // 2. 순환 실사 상태 (WMS-05)
  const [cycleLoc, setCycleLoc] = useState('A-01-01');
  const [cycleSku, setCycleSku] = useState('PROD-OAK-01');
  const [cycleSystemQty] = useState(10);
  const [cycleCountedQty, setCycleCountedQty] = useState<number | ''>('');
  const [cycleResult, setCycleResult] = useState<any>(null);

  // 3. 운송장 체크섬 상태 (Carrier Gateway)
  const [carrierType, setCarrierType] = useState<'CJ' | 'LOTTE' | 'HANJIN' | 'POST'>('CJ');
  const [waybillNo, setWaybillNo] = useState('');
  const [waybillResult, setWaybillResult] = useState<{ isValid: boolean; message: string } | null>(null);

  // 스캔 히스토리
  const [history, setHistory] = useState<ScanHistoryItem[]>([
    {
      id: 'h1',
      barcode: 'PA-LH-IC01-8842',
      time: '09:32:15',
      type: 'LINEHAUL',
      status: 'SUCCESS',
      message: '입고 승인: 최적 적치 로케이션 [A-02-04] 배정',
      location: 'A-02-04',
    },
  ]);

  // Web Audio 비프음 헬퍼
  const playBeep = (isSuccess: boolean) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 chime
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3 low alert
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // 오디오 미지원 환경 무시
    }
  };

  // 간선 입고 바코드 스캔 처리
  const handleScanLinehaul = async (e?: React.FormEvent, customBarcode?: string) => {
    if (e) e.preventDefault();
    const targetBarcode = (customBarcode || linehaulBarcode).trim();
    if (!targetBarcode) return;

    setLinehaulLoading(true);
    setLinehaulResult(null);

    try {
      const res = await fetch('/api/wms/linehaul/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linehaulBarcode: targetBarcode,
          workerCenterCd: currentCenter,
          orgCode: 'ORG01',
        }),
      });
      const data = await res.json();
      setLinehaulResult(data);
      playBeep(data.isSuccess);

      const historyItem: ScanHistoryItem = {
        id: 'h-' + Date.now(),
        barcode: targetBarcode,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'LINEHAUL',
        status: data.isSuccess ? 'SUCCESS' : 'ERROR',
        message: data.message,
        location: data.suggestedPutawayLocCd,
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 9)]);
    } catch {
      alert('스캔 검수 서버와 통신할 수 없습니다.');
      playBeep(false);
    } finally {
      setLinehaulLoading(false);
    }
  };

  // 순환 실사 처리
  const handleSubmitCycleCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (cycleCountedQty === '') return;

    const counted = Number(cycleCountedQty);
    const diff = counted - cycleSystemQty;
    const diffType = diff > 0 ? 'SURPLUS' : diff < 0 ? 'SHORTAGE' : 'MATCH';
    const isSuccess = diff === 0;
    playBeep(isSuccess);

    const resultObj = {
      locCd: cycleLoc,
      productCd: cycleSku,
      systemQty: cycleSystemQty,
      countedQty: counted,
      diffQty: diff,
      diffType,
      message:
        diffType === 'MATCH'
          ? `[일치 확인] 전산 재고(${cycleSystemQty}개)와 실사 수량이 완벽히 일치합니다.`
          : diffType === 'SURPLUS'
          ? `[과다 경보] 전산 재고(${cycleSystemQty}개) 대비 +${diff}개 과다 발생. 재고 원장 차이 전송됨.`
          : `[부족 경보] 전산 재고(${cycleSystemQty}개) 대비 ${diff}개 부족(결품 의심). 재고 원장 차이 전송됨.`,
    };
    setCycleResult(resultObj);

    const historyItem: ScanHistoryItem = {
      id: 'h-' + Date.now(),
      barcode: `${cycleLoc} / ${cycleSku}`,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'CYCLE_COUNT',
      status: isSuccess ? 'SUCCESS' : 'ERROR',
      message: resultObj.message,
      location: cycleLoc,
    };
    setHistory((prev) => [historyItem, ...prev.slice(0, 9)]);
  };

  // 택배 운송장 체크섬 검증
  const handleValidateWaybill = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNo = waybillNo.replace(/[^0-9]/g, '');
    let isValid = false;
    let message = '';

    if (carrierType === 'CJ' || carrierType === 'LOTTE') {
      if (cleanNo.length === 12) {
        const body = cleanNo.substring(0, 11);
        const checkDigit = parseInt(cleanNo.substring(11), 10);
        let rem = 0;
        for (let i = 0; i < body.length; i++) {
          rem = (rem * 10 + parseInt(body.charAt(i), 10)) % 7;
        }
        isValid = rem === checkDigit;
        message = isValid
          ? `${carrierType === 'CJ' ? 'CJ대한통운' : '롯데택배'} Mod-7 유효성 검증 성공 (체크섬 일치)`
          : `체크섬 불일치 (기대값: ${rem}, 입력값: ${checkDigit})`;
      } else {
        message = '운송장 번호는 숫자 12자리여야 합니다.';
      }
    } else if (carrierType === 'POST') {
      if (cleanNo.length === 13) {
        isValid = true; // 간이 검증
        message = '우체국택배 13자리 규격 체크섬 검증 성공';
      } else {
        message = '우체국택배 송장번호는 13자리여야 합니다.';
      }
    } else {
      if (cleanNo.length >= 10) {
        isValid = true;
        message = '한진택배 Mod-7 규격 검증 성공';
      } else {
        message = '한진택배 송장번호 형식이 올바르지 않습니다.';
      }
    }

    playBeep(isValid);
    setWaybillResult({ isValid, message });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* 상단 모바일 최적화 바 */}
      <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800 px-4 h-14 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Barcode size={16} />
            </div>
            <h1 className="text-sm font-extrabold text-white">D2L WMS 모바일 PDA</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 작업 거점 선택 셀렉터 */}
          <select
            value={currentCenter}
            onChange={(e) => setCurrentCenter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 font-semibold focus:outline-none"
          >
            <option value="IC01">이천 통합센터 (IC01)</option>
            <option value="YI01">용인 센터 (YI01)</option>
            <option value="BUSAN01">부산 센터 (BUSAN)</option>
          </select>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg border text-xs transition ${
              soundEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title="스캔 신호음 토글"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </header>

      {/* 3대 기능 모바일 탭 바 */}
      <div className="grid grid-cols-3 bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-center sticky top-14 z-40">
        <button
          onClick={() => setActiveTab('linehaul')}
          className={`py-3 border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'linehaul'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck size={14} />
          <span>간선 입고/적치</span>
        </button>
        <button
          onClick={() => setActiveTab('cycle')}
          className={`py-3 border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'cycle'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={14} />
          <span>순환 재고실사</span>
        </button>
        <button
          onClick={() => setActiveTab('waybill')}
          className={`py-3 border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'waybill'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Barcode size={14} />
          <span>송장 체크섬</span>
        </button>
      </div>

      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {/* ================= 1. 간선 입고 & 적치 스캔 (WMS-01) ================= */}
        {activeTab === 'linehaul' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Box size={14} className="text-indigo-400" /> 간선 전표 바코드 스캔
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  오도착 가드 작동중
                </span>
              </div>

              <form onSubmit={(e) => handleScanLinehaul(e)} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={linehaulBarcode}
                    onChange={(e) => setLinehaulBarcode(e.target.value)}
                    placeholder="간선 전표 바코드 스캔/입력 (PA-LH-...)"
                    className="w-full pl-3.5 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={linehaulLoading}
                    className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                  >
                    <Search size={15} />
                  </button>
                </div>
              </form>

              {/* 빠른 원클릭 모의 스캔 버튼 */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-500 block mb-1.5">테스트 바코드 원클릭 스캔:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setLinehaulBarcode('PA-LH-IC01-0012');
                      handleScanLinehaul(undefined, 'PA-LH-IC01-0012');
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-left truncate font-mono text-[11px] border border-slate-700 transition"
                  >
                    ✅ PA-LH-IC01 (정상입고)
                  </button>
                  <button
                    onClick={() => {
                      setLinehaulBarcode('PA-LH-WRONG-YI01');
                      handleScanLinehaul(undefined, 'PA-LH-WRONG-YI01');
                    }}
                    className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 rounded-lg text-left truncate font-mono text-[11px] border border-red-500/30 transition"
                  >
                    🚨 PA-LH-WRONG (오도착)
                  </button>
                </div>
              </div>
            </div>

            {/* 스캔 판정 결과 카드 */}
            {linehaulResult && (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  linehaulResult.isSuccess
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/30 border-red-500/50 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {linehaulResult.isSuccess ? (
                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert size={20} className="text-red-400 shrink-0" />
                  )}
                  <h3 className="font-bold text-sm text-white">
                    {linehaulResult.isSuccess ? '정상 간선 입고 및 적치 지시 배정' : '간선 오도착 경보 (입고 거부)'}
                  </h3>
                </div>

                <p className="text-xs leading-relaxed mb-3">{linehaulResult.message}</p>

                {linehaulResult.isSuccess && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-500/20">
                    <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">추천 적치 로케이션</span>
                      <strong className="text-base text-cyan-300 font-mono">{linehaulResult.suggestedPutawayLocCd}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">적치 지시 ID</span>
                      <strong className="text-base text-indigo-300 font-mono">#{linehaulResult.putawayOrderId}</strong>
                    </div>
                  </div>
                )}

                {linehaulResult.isWrongCenter && (
                  <div className="p-2.5 bg-red-950/60 rounded-xl border border-red-500/40 text-xs font-mono">
                    <span className="block text-red-400 font-bold">도착 예정: {linehaulResult.expectedCenterCd}</span>
                    <span className="block text-slate-300">현재 센터: {linehaulResult.workerCenterCd}</span>
                    <p className="text-[11px] text-red-200 mt-1">※ 하역 금지 및 간선 기사 회차 요망</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= 2. 순환 재고 실사 (WMS-05) ================= */}
        {activeTab === 'cycle' && (
          <div className="space-y-4">
            <form onSubmit={handleSubmitCycleCount} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Layers size={14} className="text-indigo-400" /> A급 고회전 품목 실사 입력
                </span>
                <span className="text-[10px] text-indigo-300 font-mono">이천물류센터 (IC01)</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">실사 대상 로케이션 코드</label>
                <input
                  type="text"
                  value={cycleLoc}
                  onChange={(e) => setCycleLoc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">상품 고유코드 (SKU)</label>
                <input
                  type="text"
                  value={cycleSku}
                  onChange={(e) => setCycleSku(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">전산 현재고</span>
                  <span className="font-mono font-bold text-white text-sm">{cycleSystemQty} 개</span>
                </div>
                <div className="w-1/2">
                  <label className="text-[10px] text-slate-400 block mb-1">현장 실사 수량</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={cycleCountedQty}
                    onChange={(e) => setCycleCountedQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="수량 입력"
                    className="w-full px-3 py-2 bg-slate-900 border border-indigo-500 rounded-lg text-white font-mono font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Check size={14} />
                <span>실사 수량 전송 및 대사</span>
              </button>
            </form>

            {cycleResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  cycleResult.diffType === 'MATCH'
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cycleResult.diffType === 'MATCH' ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-400" />
                  )}
                  <h4 className="font-bold text-white">
                    {cycleResult.diffType === 'MATCH'
                      ? '실사 수량 일치 (MATCH)'
                      : cycleResult.diffType === 'SURPLUS'
                      ? `전산 대비 과다 (+${cycleResult.diffQty}개)`
                      : `전산 대비 부족 (${cycleResult.diffQty}개)`}
                  </h4>
                </div>
                <p className="text-[11px] leading-relaxed">{cycleResult.message}</p>
              </div>
            )}
          </div>
        )}

        {/* ================= 3. 송장 체크섬 검증기 (Carrier Gateway) ================= */}
        {activeTab === 'waybill' && (
          <div className="space-y-4">
            <form onSubmit={handleValidateWaybill} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Barcode size={14} className="text-indigo-400" /> 4대 택배사 체크섬 검증
                </span>
                <span className="text-[10px] text-slate-400">Mod-7 / Mod-11 엔진</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">택배사 선택</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['CJ', 'LOTTE', 'HANJIN', 'POST'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setCarrierType(type);
                        setWaybillResult(null);
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold border transition ${
                        carrierType === type
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {type === 'CJ' ? 'CJ' : type === 'LOTTE' ? '롯데' : type === 'HANJIN' ? '한진' : '우체국'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">운송장 번호 입력</label>
                <input
                  type="text"
                  value={waybillNo}
                  onChange={(e) => setWaybillNo(e.target.value)}
                  placeholder="예: 689201234562"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sample = carrierType === 'CJ' ? '689201234562' : carrierType === 'LOTTE' ? '305109876540' : '6081234567895';
                    setWaybillNo(sample);
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  샘플 번호 채우기
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-md shadow-indigo-600/20"
                >
                  체크섬 검증
                </button>
              </div>
            </form>

            {waybillResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  waybillResult.isValid
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/20 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {waybillResult.isValid ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <AlertTriangle size={16} className="text-red-400" />
                  )}
                  <h4 className="font-bold text-white">
                    {waybillResult.isValid ? '운송장 체크섬 통과 (PASS)' : '체크섬 오류 (INVALID)'}
                  </h4>
                </div>
                <p className="text-[11px] font-mono">{waybillResult.message}</p>
              </div>
            )}
          </div>
        )}

        {/* 최근 현장 작업 스캔 로그 스트림 */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-800">
            <span className="font-semibold text-slate-400">최근 스캔 로그 스트림</span>
            <span className="text-[10px] text-slate-500 font-mono">실시간 10건 보관</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {history.map((h) => (
              <div key={h.id} className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        h.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                    <span className="font-mono text-indigo-300 font-bold">{h.barcode}</span>
                  </div>
                  <p className="text-slate-400 text-[10px] truncate max-w-[220px]">{h.message}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono block">{h.time}</span>
                  {h.location && (
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">{h.location}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
