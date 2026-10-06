'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck, LogOut, ExternalLink, Calendar, Layers,
  CheckCircle2, Search, FileText, Download, AlertTriangle
} from 'lucide-react';

interface UserOrgInfo {
  userName: string;
  orgName: string;
  orgCode: string;
  role: string;
  clientMasterCd?: string | null;
  clientMasterNm?: string | null;
}

interface ClientOrderRow {
  orderNo: string;
  consigneeNm: string;
  deliveryDt: string;
  statusNm: string;
  status: string;
  trackToken: string;
}

export default function ClientDashboardView({
  orgInfo,
  userEmail,
  onOpenSpring,
  onLogout,
}: {
  orgInfo: UserOrgInfo | null;
  userEmail: string | null;
  onOpenSpring: (p: string) => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<'orders' | 'atp' | 'bom' | 'etax'>('orders');

  // 1. 위탁 배송 목록
  const [orders] = useState<ClientOrderRow[]>([
    { orderNo: 'ORD-20261007-0012', consigneeNm: '홍*동', deliveryDt: '2026-10-07', status: '7000', statusNm: '배송중', trackToken: 'DEV_ORG01_10521' },
    { orderNo: 'ORD-20261007-0011', consigneeNm: '김*수', deliveryDt: '2026-10-07', status: '9999', statusNm: '배송완료', trackToken: 'DEV_ORG01_10520' },
    { orderNo: 'ORD-20261007-0010', consigneeNm: '이*진', deliveryDt: '2026-10-07', status: '9999', statusNm: '배송완료', trackToken: 'DEV_ORG01_10519' },
    { orderNo: 'ORD-20261007-0009', consigneeNm: '박*훈', deliveryDt: '2026-10-06', status: '9999', statusNm: '배송완료', trackToken: 'DEV_ORG01_10518' },
  ]);

  // 2. ATP 시뮬레이터 상태
  const [atpAddr, setAtpAddr] = useState('서울특별시 강남구 테헤란로 152');
  const [atpProductId, setAtpProductId] = useState(101);
  const [atpQty, setAtpQty] = useState(1);
  const [atpLoading, setAtpLoading] = useState(false);
  const [atpResult, setAtpResult] = useState<any>(null);

  const handleCalculateAtp = async () => {
    setAtpLoading(true);
    try {
      const res = await fetch('/api/atp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgCode: orgInfo?.orgCode || 'ORG01',
          centerCd: 'IC01',
          productId: atpProductId,
          destAddr: atpAddr,
          requestQty: atpQty,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAtpResult(json.data);
      } else {
        alert(json.message || 'ATP 산출에 실패했습니다.');
      }
    } catch {
      alert('서버와 통신할 수 없습니다.');
    } finally {
      setAtpLoading(false);
    }
  };

  // 3. BOM 세트 검증기 상태
  const [bomSetId, setBomSetId] = useState(100);
  const [bomQty, setBomQty] = useState(5);
  const [bomLoading, setBomLoading] = useState(false);
  const [bomResult, setBomResult] = useState<any>(null);

  const handleValidateBom = async () => {
    setBomLoading(true);
    try {
      const res = await fetch('/api/bom-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgCode: orgInfo?.orgCode || 'ORG01',
          centerCd: 'IC01',
          setProductId: bomSetId,
          requestedQty: bomQty,
        }),
      });
      const json = await res.json();
      setBomResult(json);
    } catch {
      alert('서버와 통신할 수 없습니다.');
    } finally {
      setBomLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* 화주사 상단 네비게이션 */}
      <nav className="w-full bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            DOT2LINE
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
            화주사 B2B 콘솔
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">{userEmail}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition"
          >
            <LogOut size={13} /> 로그아웃
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* 화주사 헤더 & 퀵 액션 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              위탁사: {orgInfo?.orgName}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {orgInfo?.clientMasterNm || '화주사'} 물류 운영 현황
            </h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onOpenSpring('/ApiPortal')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              API 연동키 관리
            </button>
            <button
              onClick={() => onOpenSpring('/')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <span>주문 대량 등록</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* 4대 핵심 지표 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 sm:p-4 bg-slate-900/60 border border-indigo-500/20 rounded-xl">
            <p className="text-[11px] font-medium text-slate-400 mb-1">당월 누적 주문</p>
            <p className="text-base sm:text-xl font-bold text-white mb-0.5">142 건</p>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">이번 달 위탁 접수</p>
          </div>
          <div className="p-3.5 sm:p-4 bg-slate-900/60 border border-amber-500/20 rounded-xl">
            <p className="text-[11px] font-medium text-slate-400 mb-1">현재 실시간 배송중</p>
            <p className="text-base sm:text-xl font-bold text-white mb-0.5">8 건</p>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">기사 운행 중</p>
          </div>
          <div className="p-3.5 sm:p-4 bg-slate-900/60 border border-emerald-500/20 rounded-xl">
            <p className="text-[11px] font-medium text-slate-400 mb-1">배송 완료 (금월)</p>
            <p className="text-base sm:text-xl font-bold text-white mb-0.5">134 건</p>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">정시 배송률 98.5%</p>
          </div>
          <div className="p-3.5 sm:p-4 bg-slate-900/60 border border-purple-500/20 rounded-xl">
            <p className="text-[11px] font-medium text-slate-400 mb-1">위탁 보관 SKU</p>
            <p className="text-base sm:text-xl font-bold text-white mb-0.5">24 종</p>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">이천/용인 센터 가용</p>
          </div>
        </div>

        {/* 4대 운영 서브탭 전환 바 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setSubTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              subTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Truck size={14} />
            <span>최근 위탁 배송 목록</span>
          </button>
          <button
            onClick={() => {
              setSubTab('atp');
              if (!atpResult) handleCalculateAtp();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              subTab === 'atp'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Calendar size={14} />
            <span>납기 약속(ATP) 시뮬레이터</span>
          </button>
          <button
            onClick={() => {
              setSubTab('bom');
              if (!bomResult) handleValidateBom();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              subTab === 'bom'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>BOM 세트 재고 검증</span>
          </button>
          <button
            onClick={() => setSubTab('etax')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              subTab === 'etax'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>전자세금계산서 (홈택스)</span>
          </button>
        </div>

        {/* 1. 위탁 배송 목록 탭 */}
        {subTab === 'orders' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Truck size={16} className="text-indigo-400" /> 실시간 배송 관제 및 토큰 추적
              </h3>
              <button
                onClick={() => router.push('/track')}
                className="text-xs text-indigo-400 hover:underline"
              >
                전체 주문 검색 →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 border-b border-slate-800 pb-2">
                  <tr>
                    <th className="py-2.5 font-medium">주문번호</th>
                    <th className="py-2.5 font-medium">수취인</th>
                    <th className="py-2.5 font-medium">배송일자</th>
                    <th className="py-2.5 font-medium">상태</th>
                    <th className="py-2.5 font-medium text-right">실시간 관제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {orders.map((ord) => (
                    <tr key={ord.orderNo}>
                      <td className="py-3 font-mono text-indigo-300">{ord.orderNo}</td>
                      <td className="py-3 font-medium text-white">{ord.consigneeNm}</td>
                      <td className="py-3 text-slate-400">{ord.deliveryDt}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ord.status === '9999'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {ord.statusNm}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => router.push(`/track/${ord.trackToken}`)}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition active:scale-95"
                        >
                          실시간 추적
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. ATP 납기 약속 시뮬레이터 탭 */}
        {subTab === 'atp' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Calendar size={16} className="text-indigo-400" /> 실시간 약속 배송일(ATP) 산출기
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                재고 수량, 주문 마감 시간(14:00), 권역 운행 스케줄, 차량 CAPA를 실시간 대사하여 고객에게 확약 가능한 최단 배송일을 산출합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">고객 배송지 주소</label>
                <input
                  type="text"
                  value={atpAddr}
                  onChange={(e) => setAtpAddr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  placeholder="도로명 주소 입력"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">상품 고유번호 (SKU ID)</label>
                <input
                  type="number"
                  value={atpProductId}
                  onChange={(e) => setAtpProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">주문 수량</label>
                  <input
                    type="number"
                    min="1"
                    value={atpQty}
                    onChange={(e) => setAtpQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <button
                  onClick={handleCalculateAtp}
                  disabled={atpLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Search size={13} />
                  <span>{atpLoading ? '계산중...' : '납기 산출'}</span>
                </button>
              </div>
            </div>

            {atpResult && (
              <div className="p-4 bg-slate-800/40 border border-indigo-500/20 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-700/50">
                  <div>
                    <span className="text-xs text-indigo-400 font-semibold">최단 약속 가능일 (Promised Date)</span>
                    <h4 className="text-xl font-extrabold text-white mt-0.5">
                      {atpResult.promisedDeliveryDate?.replace(/(\d{4})(\d{2})(\d{2})/, '$1년 $2월 $3일') || '조회 완료'}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {atpResult.atpType === 'IMMEDIATE_STOCK' ? '즉시 출고 가능' : '예약/입고연계 가능'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">배정 물류센터</span>
                    <span className="font-bold text-white">{atpResult.assignedCenterNm}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">배송 권역</span>
                    <span className="font-bold text-white">{atpResult.assignedZoneNm}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">센터 가용 재고</span>
                    <span className="font-bold text-emerald-400">{atpResult.effectiveStockQty} 개</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">소요일수 (Lead-Time)</span>
                    <span className="font-bold text-indigo-300">D+{atpResult.leadTimeDays} 일</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <strong className="text-indigo-300">산출 근거:</strong> {atpResult.reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. BOM 세트 재고 검증 탭 */}
        {subTab === 'bom' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers size={16} className="text-indigo-400" /> BOM 세트상품 출고 가용성 & 병목 부품 검증
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                세트 상품 출고 시 하위 구성품(부품) 중 하나라도 부족하면 부분 출고를 원천 차단하고 최대 조립 가능 수량을 계산합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">세트 상품 고유번호 (Set Product ID)</label>
                <input
                  type="number"
                  value={bomSetId}
                  onChange={(e) => setBomSetId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2">
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">세트 출고 요청 수량</label>
                  <input
                    type="number"
                    min="1"
                    value={bomQty}
                    onChange={(e) => setBomQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <button
                  onClick={handleValidateBom}
                  disabled={bomLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 size={13} />
                  <span>{bomLoading ? '검증중...' : '부품 재고 검증'}</span>
                </button>
              </div>
            </div>

            {bomResult && (
              <div className="p-4 bg-slate-800/40 border border-indigo-500/20 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-700/50">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">검증 대상 세트 상품</span>
                    <h4 className="text-lg font-bold text-white">
                      {bomResult.setProductNm} ({bomResult.setProductCd})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        bomResult.isApprovedForPicking
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {bomResult.isApprovedForPicking ? '출고 승인 가능 (AVAILABLE)' : '부품 재고 부족 (LACK_OF_COMPONENT)'}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      최대 제작가능: <strong className="text-indigo-300">{bomResult.maxBuildableKitQty} 세트</strong>
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-lg text-xs ${bomResult.isApprovedForPicking ? 'bg-emerald-950/20 text-emerald-300 border border-emerald-500/20' : 'bg-red-950/20 text-red-300 border border-red-500/20'}`}>
                  {bomResult.message}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-300 mb-2">하위 구성 부품별 소요량 및 가용 재고 상세</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-slate-400 border-b border-slate-700/50 pb-1.5">
                        <tr>
                          <th className="py-2">부품명 / 코드</th>
                          <th className="py-2 text-center">세트당 비율</th>
                          <th className="py-2 text-center">총 필요수량</th>
                          <th className="py-2 text-center">센터 가용재고</th>
                          <th className="py-2 text-center">부족수량</th>
                          <th className="py-2 text-right">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {bomResult.components?.map((c: any) => (
                          <tr key={c.componentProductId}>
                            <td className="py-2.5 font-medium text-white">
                              {c.componentProductNm} <span className="text-slate-500 text-[11px]">({c.componentProductCd})</span>
                            </td>
                            <td className="py-2.5 text-center font-mono">{c.componentQtyRatio}</td>
                            <td className="py-2.5 text-center font-mono text-slate-200">{c.requiredQty}</td>
                            <td className="py-2.5 text-center font-mono text-emerald-400">{c.availableStockQty}</td>
                            <td className="py-2.5 text-center font-mono text-red-400 font-semibold">{c.shortageQty > 0 ? `-${c.shortageQty}` : '0'}</td>
                            <td className="py-2.5 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.status === 'SUFFICIENT'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {c.status === 'SUFFICIENT' ? '충족' : '부족 (병목)'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. 전자세금계산서 탭 */}
        {subTab === 'etax' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileText size={16} className="text-indigo-400" /> 국세청(NTS) 전자세금계산서 발행 및 수취 내역
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                화주사 월별 물류 보관·운송 정산에 대한 국세청 전자세금계산서(KS X 1006 표준 규격) 발행 내역 및 승인번호를 확인합니다.
              </p>
            </div>

            <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                <div>
                  <span className="text-xs font-mono text-indigo-300">TI-S-20261007-0001</span>
                  <p className="text-sm font-bold text-white">2026년 10월분 물류보관 및 운송 위탁용역</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                    국세청 전송성공
                  </span>
                  <p className="text-xs text-slate-400 mt-1 font-mono">승인: 202610074100000000012345</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center text-xs text-slate-300 pt-1">
                <span>공급가액: <strong>₩ 1,000,000</strong> / 세액: <strong>₩ 100,000</strong></span>
                <span className="font-bold text-emerald-400 text-sm">합계금액: ₩ 1,100,000</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <a
                  href="/api/settlement/etax/xml/1001"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>국세청 표준 XML 다운로드</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
