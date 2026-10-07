'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSignature, Calculator, Handshake, CheckCircle2, ArrowRight,
  ArrowLeft, Download, ShieldCheck, Building, Calendar, Layers,
  Truck, Box, DollarSign, PenTool, Sparkles, RefreshCw, X, Check,
  AlertCircle, FileText
} from 'lucide-react';

interface QuotationLineItem {
  seq?: number;
  stableKey: string;
  domain: string;
  domainNm?: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxType: 'TAXABLE' | 'ZERO' | 'EXEMPT';
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  note: string;
}

interface QuotationData {
  quotationNo: string;
  partyName: string;
  title: string;
  basisPeriod: string;
  validTo: string;
  lines: QuotationLineItem[];
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  message: string;
}

export default function QuotationContractPage() {
  const router = useRouter();

  // 화주사 기본 정보
  const [partyName, setPartyName] = useState('(주)디앤엘리빙 화주사업부');
  const [bizNo, setBizNo] = useState('120-81-98765');
  const [basisPeriod, setBasisPeriod] = useState('2026-10-07 ~ 2027-10-06 (1년 위탁)');

  // 견적 라인 아이템 설정
  const [lines, setLines] = useState<QuotationLineItem[]>([
    {
      stableKey: 'LINE-01',
      domain: 'WMS',
      domainNm: '보관/WMS',
      itemName: '파렛트(PLT) 정온 보관료',
      unit: 'PLT',
      quantity: 30,
      unitPrice: 15000, // 월 1.5만원 (일 500원 기준)
      taxType: 'TAXABLE',
      supplyAmount: 450000,
      taxAmount: 45000,
      totalAmount: 495000,
      note: '이천물류센터 파렛트 랙 적치 기준',
    },
    {
      stableKey: 'LINE-02',
      domain: 'WMS',
      domainNm: '보관/WMS',
      itemName: '입출고 하역 및 유통가공(검수)',
      unit: 'BOX',
      quantity: 300,
      unitPrice: 500,
      taxType: 'TAXABLE',
      supplyAmount: 150000,
      taxAmount: 15000,
      totalAmount: 165000,
      note: 'BOM 세트 박스 단위 검수 및 포장',
    },
    {
      stableKey: 'LINE-03',
      domain: 'DELIVERY',
      domainNm: '수배송/TMS',
      itemName: '수도권 1T 탑차 정기 배송',
      unit: 'JOB',
      quantity: 20,
      unitPrice: 75000,
      taxType: 'TAXABLE',
      supplyAmount: 1500000,
      taxAmount: 150000,
      totalAmount: 1650000,
      note: '2-Opt 최적 경로 배차 및 비대면 문앞 배송',
    },
    {
      stableKey: 'LINE-04',
      domain: 'PARCEL',
      domainNm: '택배/Carrier',
      itemName: 'CJ/롯데 전국 택배 위탁 발송',
      unit: 'BOX',
      quantity: 500,
      unitPrice: 2800,
      taxType: 'TAXABLE',
      supplyAmount: 1400000,
      taxAmount: 140000,
      totalAmount: 1540000,
      note: 'CJ대한통운 계약 요율 적용',
    },
    {
      stableKey: 'LINE-05',
      domain: 'DELIVERY',
      domainNm: '특수부가서비스',
      itemName: '2인 1조 가구 완제품 조립/설치 배송',
      unit: 'ORDER',
      quantity: 15,
      unitPrice: 45000,
      taxType: 'TAXABLE',
      supplyAmount: 675000,
      taxAmount: 67500,
      totalAmount: 742500,
      note: '전동 드라이버 조립 및 포장재 수거 포함',
    },
  ]);

  // 견적 산출 결과
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // 전자 계약 체결 상태
  const [isContractStep, setIsContractStep] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);
  const [contractResult, setContractResult] = useState<any>(null);

  // 전자 서명 캔버스
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // 초기 자동 견적 계산
  useEffect(() => {
    handleCalculateQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCalculateQuotation = async () => {
    setCalcLoading(true);
    try {
      const res = await fetch('/api/commercial/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName,
          title: `${partyName} 2026년 통합 물류 위탁 견적서`,
          basisPeriod,
          lines,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuotation(data);
      }
    } catch {
      alert('견적 계산 서버와 통신할 수 없습니다.');
    } finally {
      setCalcLoading(false);
    }
  };

  // 캔버스 초기화
  useEffect(() => {
    if (!isContractStep) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  }, [isContractStep]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleAutoSignCompany = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#6366f1';
    ctx.fillText(`(주)디앤엘리빙 대표이사 직인 [인]`, 25, 45);
    setHasSignature(true);
  };

  // 전자 계약 체결 및 단가 원장 활성화
  const handleActivateContract = async () => {
    if (!hasSignature) {
      alert('대표자 전자 서명을 먼저 완료해 주세요.');
      return;
    }
    setSigningLoading(true);

    try {
      const res = await fetch('/api/commercial/contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName,
          quotationNo: quotation?.quotationNo,
          contractPeriod: basisPeriod,
          totalAmount: quotation?.totalAmount,
          lines,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContractResult(data);
      } else {
        alert(data.message || '계약 체결 처리에 실패했습니다.');
      }
    } catch {
      alert('계약 활성화 서버와 통신할 수 없습니다.');
    } finally {
      setSigningLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!quotation) return;
    const rows = [
      ['[DOT2LINE B2B 표준 물류 위탁 견적서]'],
      ['견적번호', quotation.quotationNo],
      ['화주사', quotation.partyName],
      ['기준기간', quotation.basisPeriod],
      ['공급가액(원)', quotation.supplyAmount.toString()],
      ['부가세(원)', quotation.taxAmount.toString()],
      ['합계금액(원)', quotation.totalAmount.toString()],
      [],
      ['순번', '구분', '서비스 항목명', '단위', '수량', '단가(원)', '공급가액(원)', '부가세(원)', '합계(원)', '조건/비고'],
      ...quotation.lines.map((l, idx) => [
        (l.seq || idx + 1).toString(),
        l.domain,
        l.itemName,
        l.unit,
        l.quantity.toString(),
        l.unitPrice.toString(),
        l.supplyAmount.toString(),
        l.taxAmount.toString(),
        l.totalAmount.toString(),
        l.note,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `물류위탁견적서_${quotation.quotationNo}.csv`);
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
            <Link href="/" className="text-xl font-extrabold bg-gradient-to-r from-amber-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              DOT2LINE
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold flex items-center gap-1">
              <Calculator size={11} /> 물류 자동 견적 & 전자 계약
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {quotation && (
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>견적서 다운로드 (CSV)</span>
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <span>대시보드로 복귀</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* 상단 타이틀 배너 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
                Automated B2B Quotation & Contract Link
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              통합 물류 위탁 견적 산출 및 전자 계약 체결 센터
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              보관·하역·배송·택배·설치 복합 단가표 실시간 대사 및 계약 단가 원장(Commercial Link) 자동 바인딩
            </p>
          </div>

          {/* 스텝 전환 바 */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs">
            <button
              onClick={() => setIsContractStep(false)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                !isContractStep
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator size={14} />
              <span>1. 견적서 산출</span>
            </button>
            <button
              onClick={() => setIsContractStep(true)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                isContractStep
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSignature size={14} />
              <span>2. 전자 계약 체결</span>
            </button>
          </div>
        </div>

        {/* ================= STEP 1: 견적서 산출 뷰 ================= */}
        {!isContractStep && (
          <div className="space-y-6">
            {/* 화주사 기본 정보 입력 그리드 */}
            <div className="p-4 sm:p-5 bg-slate-900/70 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">거래처명 (화주사)</label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-medium">사업자등록번호</label>
                <input
                  type="text"
                  value={bizNo}
                  onChange={(e) => setBizNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-medium">견적 기준 기간</label>
                <input
                  type="text"
                  value={basisPeriod}
                  onChange={(e) => setBasisPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            {/* 견적 세부 라인 아이템 테이블 */}
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Layers size={16} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">표준 물류 위탁 세부 서비스 견적 항목</h3>
                    <p className="text-xs text-slate-400">보관, 하역, 간선/배송, 택배, 특수 부가서비스 복합 요율</p>
                  </div>
                </div>

                <button
                  onClick={handleCalculateQuotation}
                  disabled={calcLoading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  <RefreshCw size={13} className={calcLoading ? 'animate-spin' : ''} />
                  <span>견적 재계산</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-400 border-b border-slate-800 pb-2">
                    <tr>
                      <th className="py-2.5 font-medium">업무 구분</th>
                      <th className="py-2.5 font-medium">서비스 항목명</th>
                      <th className="py-2.5 text-center font-medium">단위</th>
                      <th className="py-2.5 text-center font-medium">월간 수량</th>
                      <th className="py-2.5 text-right font-medium">단가 (원)</th>
                      <th className="py-2.5 text-right font-medium">공급가액 (원)</th>
                      <th className="py-2.5 text-right font-medium">합계 (VAT포함)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {lines.map((l, idx) => (
                      <tr key={l.stableKey} className="hover:bg-slate-800/30 transition">
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                            {l.domainNm}
                          </span>
                        </td>
                        <td className="py-3">
                          <strong className="text-white block">{l.itemName}</strong>
                          <span className="text-[10px] text-slate-500">{l.note}</span>
                        </td>
                        <td className="py-3 text-center font-mono text-slate-400">{l.unit}</td>
                        <td className="py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={l.quantity}
                            onChange={(e) => {
                              const newQty = Number(e.target.value);
                              setLines(lines.map((it, i) => i === idx ? { ...it, quantity: newQty } : it));
                            }}
                            className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-white font-mono"
                          />
                        </td>
                        <td className="py-3 text-right font-mono text-slate-300">
                          ₩ {l.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono font-medium text-white">
                          ₩ {(l.quantity * l.unitPrice).toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-emerald-400">
                          ₩ {Math.round(l.quantity * l.unitPrice * 1.1).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 견적 총괄 요약 카드 & 계약 진행 액션 */}
            {quotation && (
              <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-300 font-mono font-bold">견적번호: {quotation.quotationNo}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                      유효기간 30일
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white mt-1">{quotation.title}</h4>
                  <div className="flex gap-4 text-xs text-slate-400 mt-2">
                    <span>공급가액: <strong className="text-white font-mono">₩ {quotation.supplyAmount.toLocaleString()}</strong></span>
                    <span>부가세(10%): <strong className="text-slate-300 font-mono">₩ {quotation.taxAmount.toLocaleString()}</strong></span>
                  </div>
                </div>

                <div className="text-right flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-400 block">월간 위탁 예상 총액 (VAT 포함)</span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    ₩ {quotation.totalAmount.toLocaleString()}
                  </p>
                  <button
                    onClick={() => setIsContractStep(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 active:scale-95"
                  >
                    <span>표준 전자 계약 체결하기</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: 전자 계약 체결 뷰 ================= */}
        {isContractStep && (
          <div className="space-y-6">
            {contractResult ? (
              <div className="p-6 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl text-center space-y-3">
                <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
                <h3 className="text-xl font-extrabold text-white">물류 위탁 전자 계약이 정상 체결되었습니다!</h3>
                <div className="max-w-md mx-auto p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 text-left text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">계약 번호</span>
                    <strong className="text-emerald-300">{contractResult.contractNo}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">계약 단가 원장 ID</span>
                    <span className="text-indigo-300 font-bold">#{contractResult.commercialLinkId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">계약 상태</span>
                    <span className="text-emerald-400 font-bold">ACTIVE (활성화됨)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">단가 바인딩</span>
                    <span className="text-cyan-300">TMS/WMS 정산 엔진 100% 연동</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 pt-2">{contractResult.message}</p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
                  >
                    대시보드로 복귀
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 계약서 조항 뷰어 */}
                <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-indigo-400" />
                      <h3 className="text-sm font-bold text-white">B2B 표준 물류 위탁 계약서 전문</h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400">제 2026-1007 호</span>
                  </div>

                  <div className="h-96 overflow-y-auto pr-2 text-xs text-slate-300 space-y-3 leading-relaxed border border-slate-800/80 p-4 rounded-xl bg-slate-950/60 font-serif">
                    <h4 className="text-sm font-bold text-white text-center pb-2 border-b border-slate-800">
                      물 류 위 탁 표 준 계 약 서
                    </h4>
                    <p>
                      <strong>위탁인(이하 &quot;화주사&quot;):</strong> {partyName} (사업자등록번호: {bizNo})<br />
                      <strong>수탁인(이하 &quot;물류사&quot;):</strong> (주)디앤엘 로지스틱스 (사업자등록번호: 214-88-54321)
                    </p>
                    <p>
                      <strong>제 1 조 (목적)</strong><br />
                      본 계약은 화주사가 위탁하는 화물의 보관, 입출고, 간선 수송, 최종 소비자 배송 및 택배 배차 용역을 물류사가 성실히 수행함에 있어 필요한 제반 권리와 의무를 규정함을 목적으로 한다.
                    </p>
                    <p>
                      <strong>제 2 조 (계약 기간 및 기준 단가)</strong><br />
                      1. 계약 기간은 <strong>{basisPeriod}</strong>로 하며, 만료 1개월 전 상호 서면 통보가 없는 한 1년 단위로 자동 연장된다.<br />
                      2. 위탁 수수료는 상기 산출된 <strong>월 예상 합계 ₩ {quotation?.totalAmount.toLocaleString()}원</strong>(VAT 포함)의 표준 단가표를 기준으로 당월 실적에 따라 정산한다.
                    </p>
                    <p>
                      <strong>제 3 조 (서비스 수준 협약 SLA)</strong><br />
                      1. 물류사는 전국 배송 정시율(On-Time Delivery) <strong>98.0% 이상</strong>을 유지하여야 한다.<br />
                      2. 배송 중 발생한 멸실 및 파손 사고에 대해서는 화물자동차운수사업법 및 택배 표준약관에 의거하여 물류사가 전액 보상 또는 운송료에서 상계 처리한다.
                    </p>
                    <p>
                      <strong>제 4 조 (대금 청구 및 정산)</strong><br />
                      1. 물류사는 매월 말일 기준으로 보관료 및 운송료를 마감 집계하여 익월 5일까지 화주사에게 정산서를 발행한다.<br />
                      2. 국세청 전자세금계산서(KS X 1006 규격)는 익월 10일까지 승인 발행한다.
                    </p>
                  </div>
                </div>

                {/* 대표자 전자 서명 및 체결 액션 */}
                <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <PenTool size={18} className="text-amber-400" />
                      <h3 className="text-sm font-bold text-white">화주사 대표자 전자 서명</h3>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">법적 효력 공인 서명</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <p>서명 주체: <strong className="text-white">{partyName} 대표이사</strong></p>
                    <p>확인 일자: <strong className="text-slate-300 font-mono">{new Date().toLocaleDateString('ko-KR')}</strong></p>
                  </div>

                  {/* 서명 패드 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">서명 란 (터치 또는 마우스 드로잉)</span>
                      <div className="flex gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={handleAutoSignCompany}
                          className="text-indigo-400 hover:underline"
                        >
                          법인직인 자동날인
                        </button>
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="text-slate-500 hover:text-red-400"
                        >
                          지우기
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950">
                      <canvas
                        ref={canvasRef}
                        width={420}
                        height={100}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-24 touch-none cursor-crosshair"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <ShieldCheck size={13} /> 계약 체결 시 자동 연동 사항:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      <li>정산 시스템(`T_SETTLEMENT_CONTRACT`) 단가표 바인딩</li>
                      <li>TMS 1T~25T 운송료 자동 계산 매트릭스 적용</li>
                      <li>화주사 B2B 콘솔 주문 대량 업로드 권한 자동 부여</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleActivateContract}
                    disabled={signingLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <Handshake size={16} />
                    <span>{signingLoading ? '전자 계약 체결 및 단가 바인딩 중...' : '전자 서명 확정 및 계약 활성화'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
