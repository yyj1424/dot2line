'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Headphones, AlertCircle, ShieldAlert, CheckCircle2, Clock,
  ArrowRight, ArrowLeft, RefreshCw, Sparkles, Filter, DollarSign,
  User, Phone, MapPin, Check, X, FileText, ChevronRight, ShieldCheck
} from 'lucide-react';

interface CsCase {
  caseId: number;
  caseNo: string;
  orderNo: string;
  consigneeNm: string;
  consigneeTel: string;
  deliveryAddr: string;
  claimType: string;
  claimTypeNm: string;
  carrierNm: string;
  liability: string;
  liabilityNm: string;
  claimAmount: number;
  compensationAmount: number;
  status: 'INVESTIGATING' | 'LIABILITY_DECIDED' | 'COMPENSATED' | 'CLOSED';
  statusNm: string;
  createdAt: string;
  memo: string;
}

interface CsData {
  summary: {
    totalCases: number;
    investigatingCount: number;
    decidedCount: number;
    compensatedCount: number;
    closedCount: number;
    avgResolutionDays: number;
    totalCompensationWon: number;
    carrierIndemnityRecoveryRate: number;
  };
  cases: CsCase[];
}

export default function CustomerSupportPage() {
  const router = useRouter();
  const [data, setData] = useState<CsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // 신규 클레임 접수 모달
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrderNo, setNewOrderNo] = useState('ORD-20261007-0012');
  const [newConsigneeNm, setNewConsigneeNm] = useState('홍길동');
  const [newClaimType, setNewClaimType] = useState('DAMAGED');
  const [newClaimAmount, setNewClaimAmount] = useState(180000);
  const [newMemo, setNewMemo] = useState('배송 완료 후 상품 전면부 스크래치 확인으로 교환/보상 신청');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cs/cases');
      const json = await res.json();
      setData(json);
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // 보상 승인 처리
  const handleApproveCompensation = (caseId: number) => {
    if (!data) return;
    setData({
      ...data,
      cases: data.cases.map(c =>
        c.caseId === caseId
          ? { ...c, status: 'COMPENSATED', statusNm: '보상금 지급 및 정산차감 완료' }
          : c
      ),
    });
    alert('[보상 승인 완료] 해당 건의 보상금이 확정되어 운송사 정산 원장에서 자동 차감(구상 청구) 등록되었습니다.');
  };

  // 신규 클레임 등록 처리
  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    const newCase: CsCase = {
      caseId: Date.now(),
      caseNo: `CS-20261007-0${Math.floor(10 + Math.random() * 90)}`,
      orderNo: newOrderNo,
      consigneeNm: newConsigneeNm,
      consigneeTel: '010-3849-****',
      deliveryAddr: '서울특별시 송파구 올림픽로 300 14층',
      claimType: newClaimType,
      claimTypeNm: newClaimType === 'DAMAGED' ? '배송 중 파손' : newClaimType === 'WRONG_DELIVERY' ? '출고 오배송' : '배송 지연',
      carrierNm: 'D2L 직영 3호차 (이민호 / 서울81바9234)',
      liability: 'INVESTIGATING',
      liabilityNm: '현장 실사 및 귀책 판정중',
      claimAmount: newClaimAmount,
      compensationAmount: 0,
      status: 'INVESTIGATING',
      statusNm: '귀책 조사 접수',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      memo: newMemo,
    };

    setData({
      ...data,
      summary: {
        ...data.summary,
        totalCases: data.summary.totalCases + 1,
        investigatingCount: data.summary.investigatingCount + 1,
      },
      cases: [newCase, ...data.cases],
    });

    setIsModalOpen(false);
    alert('신규 CS 클레임이 등록되었습니다. 현장 조사 및 귀책 판정이 진행됩니다.');
  };

  const filteredCases = data?.cases.filter(c => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  }) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white pb-16">
      {/* 상단 글로벌 헤더 */}
      <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-extrabold bg-gradient-to-r from-rose-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              DOT2LINE
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold flex items-center gap-1">
              <Headphones size={11} /> CS 클레임 & 고객 보상 관제
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
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95"
          >
            <AlertCircle size={13} />
            <span>신규 클레임 접수</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* 상단 타이틀 배너 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
              <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
                Automated Liability & Indemnity Resolution
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              CS 클레임 조사 및 운송사 구상 청구(정산) 센터
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              배송 중 파손, 오배송, 분실 사고 귀책 자동 판정 및 정산 원장(운송료 매입) 실시간 차감 연동
            </p>
          </div>

          <button
            onClick={fetchCases}
            disabled={loading}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition"
            title="새로고침"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-rose-400' : ''} />
          </button>
        </div>

        {/* 4대 최상단 종합 지표 카드 */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle size={14} /> 당월 접수 클레임
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                  전체
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white my-1 font-mono">
                {data.summary.totalCases} <span className="text-sm font-normal text-slate-400">건</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                조사중 <strong className="text-rose-400 font-mono">{data.summary.investigatingCount}</strong>건 / 종결 <strong className="text-emerald-400 font-mono">{data.summary.closedCount}</strong>건
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Clock size={14} /> 평균 해결 소요일
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                  SLA 2일 이내
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 my-1 font-mono">
                {data.summary.avgResolutionDays} <span className="text-sm font-normal text-slate-400">일</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                1-Day 신속 맞교환 배차율 96%
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <DollarSign size={14} /> 누적 보상 확정액
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                  손해배상
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white my-1 font-mono">
                ₩ {(data.summary.totalCompensationWon / 10000).toLocaleString()} <span className="text-sm font-normal text-slate-400">만 원</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                화주사 보상금 선지급 및 보험 연계
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> 운송사 구상 회수율
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                  정산 차감
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-cyan-300 my-1 font-mono">
                {data.summary.carrierIndemnityRecoveryRate} <span className="text-sm font-normal text-slate-400">%</span>
              </p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                기사·운송사 운송료 원장 자동 상계
              </p>
            </div>
          </div>
        )}

        {/* 클레임 상태별 파이프라인 탭 바 */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          {[
            { key: 'ALL', label: '전체 클레임', count: data?.cases.length || 0 },
            { key: 'INVESTIGATING', label: '귀책 조사중', count: data?.cases.filter(c => c.status === 'INVESTIGATING').length || 0 },
            { key: 'LIABILITY_DECIDED', label: '보상 심사 대기', count: data?.cases.filter(c => c.status === 'LIABILITY_DECIDED').length || 0 },
            { key: 'COMPENSATED', label: '보상 완료', count: data?.cases.filter(c => c.status === 'COMPENSATED').length || 0 },
            { key: 'CLOSED', label: '종결', count: data?.cases.filter(c => c.status === 'CLOSED').length || 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === tab.key
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 클레임 상세 목록 카드 */}
        <div className="space-y-3">
          {filteredCases.map((c) => (
            <div
              key={c.caseId}
              className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3.5 hover:border-slate-700 transition shadow-lg"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-rose-400 text-sm">{c.caseNo}</span>
                  <span className="text-slate-500 font-mono text-xs">원주문: {c.orderNo}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {c.claimTypeNm}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      c.status === 'COMPENSATED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : c.status === 'LIABILITY_DECIDED'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                        : c.status === 'CLOSED'
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}
                  >
                    {c.statusNm}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{c.createdAt}</span>
                </div>
              </div>

              {/* 고객 및 배송 정보 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">수취인 정보</span>
                  <strong className="text-white block mt-0.5">{c.consigneeNm} ({c.consigneeTel})</strong>
                  <span className="text-slate-500 text-[10px] truncate block">{c.deliveryAddr}</span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">배송 담당 주체</span>
                  <strong className="text-indigo-300 block mt-0.5">{c.carrierNm}</strong>
                  <span className="text-slate-400 text-[10px] block mt-0.5">판정: <strong className="text-amber-300">{c.liabilityNm}</strong></span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">청구 및 보상 금액</span>
                  <strong className="text-rose-400 block mt-0.5 font-mono text-sm">₩ {c.claimAmount.toLocaleString()}</strong>
                  <span className="text-emerald-400 text-[10px] block font-mono">
                    {c.compensationAmount > 0 ? `보상확정: ₩ ${c.compensationAmount.toLocaleString()}` : '심사중'}
                  </span>
                </div>
              </div>

              {/* 사건 경위 메모 및 액션 바 */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
                <p className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex-1">
                  💬 <strong className="text-slate-400">사고 경위:</strong> {c.memo}
                </p>

                {c.status === 'LIABILITY_DECIDED' && (
                  <button
                    onClick={() => handleApproveCompensation(c.caseId)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
                  >
                    <CheckCircle2 size={14} />
                    <span>보상 확정 & 운송료 원장 자동 차감</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ================= 신규 클레임 접수 모달 ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">신규 CS 클레임 및 사고 접수</h3>
                <p className="text-xs text-slate-400">운송사 책임 판정 및 구상 청구 프로세스 연계</p>
              </div>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">원주문 번호</label>
                  <input
                    type="text"
                    required
                    value={newOrderNo}
                    onChange={(e) => setNewOrderNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">고객명</label>
                  <input
                    type="text"
                    required
                    value={newConsigneeNm}
                    onChange={(e) => setNewConsigneeNm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">클레임 유형</label>
                  <select
                    value={newClaimType}
                    onChange={(e) => setNewClaimType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="DAMAGED">배송 중 파손</option>
                    <option value="WRONG_DELIVERY">출고 오배송</option>
                    <option value="MISSING_PART">부품 누락</option>
                    <option value="DELAY">배송 지연</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">청구 금액 (원)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newClaimAmount}
                    onChange={(e) => setNewClaimAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">사고 경위 및 고객 접수 메모</label>
                <textarea
                  rows={3}
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  placeholder="파손 부위, 오배송 상품 내역 등 상세 내용을 기재해 주세요"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                />
              </div>

              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow-md shadow-rose-600/20"
                >
                  클레임 접수 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
