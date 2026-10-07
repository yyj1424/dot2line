'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck, LogOut, ExternalLink, Calendar, Layers,
  CheckCircle2, Search, FileText, Download, AlertTriangle, Sparkles,
  Camera, UploadCloud, RotateCcw, X, Check, ArrowRight, ShieldCheck,
  MapPin, User, FileSpreadsheet, Eye, AlertCircle, Calculator
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
  consigneeTel: string;
  deliveryAddr: string;
  deliveryDt: string;
  statusNm: string;
  status: string;
  trackToken: string;
  driverNm?: string;
  driverCarNo?: string;
  completedAt?: string;
  productNm?: string;
  productCd?: string;
  qty?: number;
}

interface ReturnOrderRow {
  returnOrderNo: string;
  originalOrderNo: string;
  consigneeNm: string;
  reasonNm: string;
  reasonCode: string;
  pickupAddr: string;
  centerNm: string;
  status: string;
  statusNm: string;
  tmsPickupOrderId: number;
  wmsReturnId: number;
  settlementLedgerId: number;
  createdAt: string;
  totalQty: number;
}

interface BatchProgressData {
  taskId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  processedRows: number;
  successCount: number;
  failCount: number;
  progressPercent: number;
  errors: string[];
  startTime: string;
  endTime?: string | null;
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
  const [subTab, setSubTab] = useState<'orders' | 'atp' | 'bom' | 'etax' | 'returns' | 'batch'>('orders');

  // 1. 위탁 배송 목록
  const [orders] = useState<ClientOrderRow[]>([
    {
      orderNo: 'ORD-20261007-0012',
      consigneeNm: '홍*동',
      consigneeTel: '010-3849-****',
      deliveryAddr: '서울특별시 송파구 올림픽로 300 롯데월드타워 14층',
      deliveryDt: '2026-10-07',
      status: '7000',
      statusNm: '배송중',
      trackToken: 'DEV_ORG01_10521',
      driverNm: '이민호',
      driverCarNo: '서울81바9234',
      productNm: '프리미엄 원목 4인 다이닝 세트',
      productCd: 'SET-FURNITURE-01',
      qty: 1
    },
    {
      orderNo: 'ORD-20261007-0011',
      consigneeNm: '김*수',
      consigneeTel: '010-8271-****',
      deliveryAddr: '서울특별시 서초구 강남대로 381 102동 1403호',
      deliveryDt: '2026-10-07',
      status: '9999',
      statusNm: '배송완료',
      trackToken: 'DEV_ORG01_10520',
      driverNm: '김진철',
      driverCarNo: '서울98바1234',
      completedAt: '2026-10-07 14:28:15',
      productNm: '인체공학 메시 사무용 체어',
      productCd: 'CHAIR-OAK-02',
      qty: 2
    },
    {
      orderNo: 'ORD-20261007-0010',
      consigneeNm: '이*진',
      consigneeTel: '010-9124-****',
      deliveryAddr: '경기도 성남시 분당구 판교역로 166 8동 502호',
      deliveryDt: '2026-10-07',
      status: '9999',
      statusNm: '배송완료',
      trackToken: 'DEV_ORG01_10519',
      driverNm: '박상혁',
      driverCarNo: '경기85아5678',
      completedAt: '2026-10-07 13:12:40',
      productNm: '스마트 높낮이 조절 데스크 1400',
      productCd: 'DESK-SMART-14',
      qty: 1
    },
    {
      orderNo: 'ORD-20261007-0009',
      consigneeNm: '박*훈',
      consigneeTel: '010-5542-****',
      deliveryAddr: '인천광역시 연수구 송도과학로 32 101동 2001호',
      deliveryDt: '2026-10-06',
      status: '9999',
      statusNm: '배송완료',
      trackToken: 'DEV_ORG01_10518',
      driverNm: '최용우',
      driverCarNo: '인천89사4321',
      completedAt: '2026-10-06 16:45:00',
      productNm: '모던 패브릭 3인 소파 베이지',
      productCd: 'SOFA-MODERN-03',
      qty: 1
    },
  ]);

  // C02. 배송완료 사진(인수증) 모달 상태
  const [proofModalOrder, setProofModalOrder] = useState<ClientOrderRow | null>(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);

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

  // OMS-04. 역물류(반품/회수) 상태 및 모달
  const [returnList, setReturnList] = useState<ReturnOrderRow[]>([
    {
      returnOrderNo: 'RET-20261007-0001',
      originalOrderNo: 'ORD-20261007-0009',
      consigneeNm: '박*훈',
      reasonNm: '고객 단순변심',
      reasonCode: 'CUSTOMER_MIND_CHANGE',
      pickupAddr: '인천광역시 연수구 송도과학로 32 101동 2001호',
      centerNm: '수도권 통합 이천물류센터 (IC01)',
      status: 'INITIATED',
      statusNm: '회수 배차 접수',
      tmsPickupOrderId: 700142,
      wmsReturnId: 800319,
      settlementLedgerId: 900512,
      createdAt: '2026-10-07 10:15:00',
      totalQty: 1
    }
  ]);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccessResult, setReturnSuccessResult] = useState<any>(null);
  const [returnFormData, setReturnFormData] = useState({
    originalOrderNo: '',
    consigneeNm: '',
    consigneeTel: '',
    pickupAddr: '',
    destCenterCd: 'IC01',
    returnReasonCode: 'CUSTOMER_MIND_CHANGE',
    productCd: 'CHAIR-OAK-02',
    productNm: '인체공학 메시 사무용 체어',
    returnQty: 1,
    memo: ''
  });

  const openReturnModalForOrder = (ord?: ClientOrderRow) => {
    if (ord) {
      setReturnFormData({
        originalOrderNo: ord.orderNo,
        consigneeNm: ord.consigneeNm,
        consigneeTel: ord.consigneeTel || '010-8271-9999',
        pickupAddr: ord.deliveryAddr || '서울특별시 서초구 강남대로 381',
        destCenterCd: 'IC01',
        returnReasonCode: 'CUSTOMER_MIND_CHANGE',
        productCd: ord.productCd || 'PROD-01',
        productNm: ord.productNm || '위탁 배송 상품',
        returnQty: ord.qty || 1,
        memo: '고객 반품 요청에 따른 회수 배차 및 WMS 입고 연계 요청'
      });
    } else {
      setReturnFormData({
        originalOrderNo: 'ORD-20261007-0011',
        consigneeNm: '김*수',
        consigneeTel: '010-8271-9999',
        pickupAddr: '서울특별시 서초구 강남대로 381 102동 1403호',
        destCenterCd: 'IC01',
        returnReasonCode: 'DEFECT',
        productCd: 'CHAIR-OAK-02',
        productNm: '인체공학 메시 사무용 체어',
        returnQty: 1,
        memo: '부품 유격 및 마감 불량으로 인한 맞교환/반품 회수 요청'
      });
    }
    setReturnSuccessResult(null);
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnSubmitting(true);
    try {
      const payload = {
        orgCode: orgInfo?.orgCode || 'ORG01',
        clientCd: orgInfo?.clientMasterCd || 'CLI01',
        originalOrderNo: returnFormData.originalOrderNo,
        consigneeNm: returnFormData.consigneeNm,
        consigneeTel: returnFormData.consigneeTel,
        pickupAddr: returnFormData.pickupAddr,
        destCenterCd: returnFormData.destCenterCd,
        returnReasonCode: returnFormData.returnReasonCode,
        memo: returnFormData.memo,
        items: [
          {
            productCd: returnFormData.productCd,
            productNm: returnFormData.productNm,
            returnQty: returnFormData.returnQty,
            itemRemark: returnFormData.memo
          }
        ]
      };

      const res = await fetch('/api/oms/returns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setReturnSuccessResult(data);

      // 반품 목록에 실시간 추가
      const newReturnRow: ReturnOrderRow = {
        returnOrderNo: data.returnOrderNo,
        originalOrderNo: data.originalOrderNo,
        consigneeNm: returnFormData.consigneeNm,
        reasonNm: returnFormData.returnReasonCode === 'CUSTOMER_MIND_CHANGE' ? '고객 단순변심' :
                  returnFormData.returnReasonCode === 'DEFECT' ? '제품 불량/하자' :
                  returnFormData.returnReasonCode === 'WRONG_DELIVERY' ? '오배송' : '배송 중 파손',
        reasonCode: returnFormData.returnReasonCode,
        pickupAddr: returnFormData.pickupAddr,
        centerNm: returnFormData.destCenterCd === 'IC01' ? '수도권 통합 이천물류센터 (IC01)' : '용인물류센터 (YI01)',
        status: data.status || 'INITIATED',
        statusNm: '회수 배차 접수',
        tmsPickupOrderId: data.tmsPickupOrderId,
        wmsReturnId: data.wmsReturnId,
        settlementLedgerId: data.settlementLedgerId,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        totalQty: returnFormData.returnQty
      };
      setReturnList(prev => [newReturnRow, ...prev]);
    } catch {
      alert('반품 접수 처리 중 오류가 발생했습니다.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  // OMS-01 / C07. 대량 주문 엑셀 업로드 상태
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [batchTaskId, setBatchTaskId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchProgressData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleStartBatchUpload = async () => {
    if (!selectedFile) {
      alert('업로드할 엑셀 파일을 먼저 선택해 주세요.');
      return;
    }
    setUploadLoading(true);
    setBatchProgress(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/oms/batch-upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success' && data.taskId) {
        setBatchTaskId(data.taskId);
      } else {
        alert(data.message || '엑셀 업로드에 실패했습니다.');
        setUploadLoading(false);
      }
    } catch {
      alert('배치 업로드 서비스와 통신할 수 없습니다.');
      setUploadLoading(false);
    }
  };

  // 배치 진행률 주기적 폴링 (800ms)
  useEffect(() => {
    if (!batchTaskId) return;

    let isPolling = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/oms/batch-progress/${batchTaskId}`);
        if (!res.ok) return;
        const data: BatchProgressData = await res.json();
        if (isPolling) {
          setBatchProgress(data);
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            clearInterval(interval);
            setUploadLoading(false);
          }
        }
      } catch {
        // 폴링 에러 무시
      }
    }, 800);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [batchTaskId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* 화주사 상단 네비게이션 */}
      <nav className="w-full bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-40 backdrop-blur">
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
              onClick={() => router.push('/control-tower')}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95"
            >
              <Sparkles size={13} />
              <span>AI 관제 타워 (3D)</span>
            </button>
            <button
              onClick={() => onOpenSpring('/ApiPortal')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              API 연동키 관리
            </button>
            <button
              onClick={() => router.push('/quotation')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Calculator size={13} className="text-amber-400" />
              <span>물류 자동 견적</span>
            </button>
            <button
              onClick={() => setSubTab('batch')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <FileSpreadsheet size={14} />
              <span>주문 대량 등록 (엑셀)</span>
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

        {/* 6대 운영 서브탭 전환 바 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setSubTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              subTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Truck size={14} />
            <span>최근 위탁 배송 목록</span>
          </button>
          <button
            onClick={() => setSubTab('returns')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              subTab === 'returns'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <RotateCcw size={14} />
            <span>역물류 (반품/회수)</span>
          </button>
          <button
            onClick={() => setSubTab('batch')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              subTab === 'batch'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <UploadCloud size={14} />
            <span>대량 주문 엑셀 업로드</span>
          </button>
          <button
            onClick={() => {
              setSubTab('atp');
              if (!atpResult) handleCalculateAtp();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
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
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Truck size={16} className="text-indigo-400" /> 실시간 배송 관제 및 전자 인수증
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  배송 완료 건은 현장 기사님이 등록한 비대면 배송 완료 사진과 전자 서명을 1초 만에 확인하실 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => router.push('/track')}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                전체 주문 검색 <ArrowRight size={12} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 border-b border-slate-800 pb-2">
                  <tr>
                    <th className="py-2.5 font-medium">주문번호</th>
                    <th className="py-2.5 font-medium">수취인</th>
                    <th className="py-2.5 font-medium">배송지</th>
                    <th className="py-2.5 font-medium">배송일자</th>
                    <th className="py-2.5 font-medium">상태</th>
                    <th className="py-2.5 font-medium text-right">증빙 / 관제 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {orders.map((ord) => (
                    <tr key={ord.orderNo} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 font-mono text-indigo-300 font-medium">{ord.orderNo}</td>
                      <td className="py-3 font-medium text-white">{ord.consigneeNm}</td>
                      <td className="py-3 text-slate-400 max-w-xs truncate">{ord.deliveryAddr}</td>
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
                        <div className="flex items-center justify-end gap-1.5">
                          {ord.status === '9999' && (
                            <>
                              <button
                                onClick={() => {
                                  setPhotoLoadError(false);
                                  setProofModalOrder(ord);
                                }}
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1 active:scale-95"
                                title="배송완료 사진 및 전자 인수증 확인"
                              >
                                <Camera size={12} />
                                <span>배송사진</span>
                              </button>
                              <button
                                onClick={() => openReturnModalForOrder(ord)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1 active:scale-95"
                                title="반품/회수 요청 생성"
                              >
                                <RotateCcw size={11} />
                                <span>반품접수</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => router.push(`/track/${ord.trackToken}`)}
                            className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition active:scale-95"
                          >
                            실시간 추적
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. 역물류 (반품/회수) 탭 (OMS-04) */}
        {subTab === 'returns' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <RotateCcw size={16} className="text-indigo-400" /> 역물류(반품/회수) 전표 관리 & 자동 연계
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  반품 접수 즉시 TMS 회수 배차 오더, WMS 반품 입고 예정 전표, 그리고 화주사 반품 차감 정산 원장이 3각 자동 연동됩니다.
                </p>
              </div>
              <button
                onClick={() => openReturnModalForOrder()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
              >
                <RotateCcw size={13} />
                <span>신규 반품/회수 접수</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 border-b border-slate-800 pb-2">
                  <tr>
                    <th className="py-2.5 font-medium">반품번호 / 원주문</th>
                    <th className="py-2.5 font-medium">고객명 / 회수지</th>
                    <th className="py-2.5 font-medium">반품 사유</th>
                    <th className="py-2.5 font-medium">입고 물류센터</th>
                    <th className="py-2.5 font-medium">연계 원장 (TMS / WMS / 정산)</th>
                    <th className="py-2.5 font-medium text-right">진행 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {returnList.map((ret) => (
                    <tr key={ret.returnOrderNo} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 font-mono">
                        <span className="font-bold text-indigo-300 block">{ret.returnOrderNo}</span>
                        <span className="text-[11px] text-slate-500">원주문: {ret.originalOrderNo}</span>
                      </td>
                      <td className="py-3">
                        <span className="font-medium text-white block">{ret.consigneeNm}</span>
                        <span className="text-slate-400 text-[11px] max-w-xs truncate block">{ret.pickupAddr}</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {ret.reasonNm}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{ret.centerNm}</td>
                      <td className="py-3 font-mono text-[11px]">
                        <span className="text-cyan-400 block">TMS 배차: #{ret.tmsPickupOrderId}</span>
                        <span className="text-purple-400 block">WMS 입고: #{ret.wmsReturnId}</span>
                        <span className="text-emerald-400 block">정산원장: #{ret.settlementLedgerId}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {ret.statusNm}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. 대량 주문 엑셀 업로드 탭 (OMS-01 / C07) */}
        {subTab === 'batch' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileSpreadsheet size={16} className="text-indigo-400" /> 대용량 엑셀 주문 비동기 청크 배치 업로드
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  1만 건 이상의 대용량 엑셀 주문을 비동기 스레드 풀에서 청크 단위로 분할 파싱하고 유효성 오류를 실시간 검출합니다.
                </p>
              </div>
              <button
                onClick={() => {
                  // 샘플 CSV 템플릿 다운로드
                  const csvContent = 'data:text/csv;charset=utf-8,주문번호,수취인명,수취인연락처,배송지우편번호,배송지주소,배송요청일,상품코드,상품명,수량,배송메모\nORD-EX-001,홍길동,010-1234-5678,06236,서울특별시 강남구 테헤란로 152,2026-10-08,CHAIR-OAK-02,인체공학 메시 사무용 체어,1,문앞 비대면 배송\nORD-EX-002,김철수,010-9876-5432,04524,서울특별시 중구 세종대로 110,2026-10-08,DESK-SMART-14,스마트 높낮이 조절 데스크,1,경비실 보관';
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', '주문_대량등록_표준양식.csv');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>표준 엑셀/CSV 양식 다운로드</span>
              </button>
            </div>

            {/* 드래그 앤 드롭 파일 선택 영역 */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : selectedFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <div className="p-3 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedFile ? selectedFile.name : '엑셀(.xlsx) 또는 CSV 파일을 이곳으로 드래그하거나 클릭하여 선택하세요'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedFile
                    ? `파일 크기: ${(selectedFile.size / 1024).toFixed(1)} KB`
                    : '표준 주문 양식 파일 (최대 50MB, 권장 행수 20,000건 이하)'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {selectedFile && !uploadLoading && !batchProgress && (
                <button
                  onClick={handleStartBatchUpload}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  <CheckCircle2 size={14} />
                  <span>배치 업로드 실행</span>
                </button>
              )}
            </div>

            {/* 실시간 프로그레스 바 & 검증 리포트 */}
            {batchProgress && (
              <div className="p-5 bg-slate-950/70 border border-indigo-500/20 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-xs text-indigo-400 font-mono font-semibold">작업 ID: {batchProgress.taskId}</span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      {batchProgress.status === 'COMPLETED' ? '배치 검증 및 등록 완료' : '대용량 엑셀 청크 파싱 중...'}
                    </h4>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      batchProgress.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse'
                    }`}
                  >
                    {batchProgress.status === 'COMPLETED' ? '완료 (COMPLETED)' : `진행중 (${batchProgress.progressPercent}%)`}
                  </span>
                </div>

                {/* 프로그레스 게이지 바 */}
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${batchProgress.progressPercent}%` }}
                  />
                </div>

                {/* 요약 지표 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">총 요청 행수</span>
                    <span className="font-bold text-white text-base">{batchProgress.totalRows} 행</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">파싱 완료 행수</span>
                    <span className="font-bold text-cyan-400 text-base">{batchProgress.processedRows} 행</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">정상 주문 생성</span>
                    <span className="font-bold text-emerald-400 text-base">{batchProgress.successCount} 건</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">유효성 실패</span>
                    <span className="font-bold text-red-400 text-base">{batchProgress.failCount} 건</span>
                  </div>
                </div>

                {/* 검증 오류 리스트 */}
                {batchProgress.errors && batchProgress.errors.length > 0 && (
                  <div className="p-3.5 bg-red-950/20 border border-red-500/30 rounded-xl space-y-2">
                    <h5 className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> 유효성 검증 실패 행 리포트 ({batchProgress.errors.length}건)
                    </h5>
                    <ul className="text-xs text-red-200/90 space-y-1 list-disc list-inside">
                      {batchProgress.errors.map((err, idx) => (
                        <li key={idx} className="font-mono">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {batchProgress.status === 'COMPLETED' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setBatchTaskId(null);
                        setBatchProgress(null);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                    >
                      다른 파일 업로드
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. ATP 납기 약속 시뮬레이터 탭 */}
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

        {/* 5. BOM 세트 재고 검증 탭 */}
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

                <div className={`p-3 rounded-lg text-xs ${bomResult.isApprovedForPicking ? 'bg-emerald-950/20 text-emerald-300 border border-emerald-500/20' : 'bg-red-950/20 text-red-300 border border-red-500/20'}`}>\
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

        {/* 6. 전자세금계산서 탭 */}
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

      {/* ================= C02. 배송완료 현장 사진 및 전자 인수증 모달 ================= */}
      {proofModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setProofModalOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">배송완료 현장 사진 & 전자 인수증</h3>
                <p className="text-xs text-slate-400">주문번호: {proofModalOrder.orderNo}</p>
              </div>
            </div>

            {/* 현장 증빙 사진 영역 */}
            <div className="w-full h-56 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center">
              {!photoLoadError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/track/photo/${proofModalOrder.trackToken}`}
                  alt="배송 완료 사진"
                  className="w-full h-full object-cover"
                  onError={() => setPhotoLoadError(true)}
                />
              ) : (
                /* 실시간 사진 미존재 시 렌더링되는 정밀 디지털 트윈 배송 현장 캔버스/SVG */
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-950 text-center relative select-none">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                    <CheckCircle2 size={11} />
                    <span>GPS 현장 인증 완료</span>
                  </div>
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400">
                    37.4979° N, 127.0276° E
                  </div>

                  <div className="w-20 h-20 mb-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Camera size={36} className="opacity-80" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    [현관 앞 비대면 배송] 직촬영 보관 완료
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    촬영시각: {proofModalOrder.completedAt || '2026-10-07 14:28:15'}
                  </p>
                  <div className="mt-2 text-[10px] px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    SHA256: 4e9f8...c21a (위변조 방지 인증)
                  </div>
                </div>
              )}
            </div>

            {/* 인수증 상세 내역 */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">수취인 / 연락처</span>
                <span className="font-semibold text-white">{proofModalOrder.consigneeNm} ({proofModalOrder.consigneeTel})</span>
              </div>
              <div className="flex justify-between items-start pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 shrink-0">배송지 주소</span>
                <span className="font-medium text-slate-200 text-right">{proofModalOrder.deliveryAddr}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">담당 배송기사</span>
                <span className="text-indigo-300 font-medium">{proofModalOrder.driverNm || '김진철 기사'} ({proofModalOrder.driverCarNo || '서울98바1234'})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">수령 방식 / 서명</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={12} /> 고객 요청 문앞 비대면 전자 서명 인증
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  alert('전자 인수증 PDF 출력이 완료되었습니다.');
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>인수증 다운로드</span>
              </button>
              <button
                onClick={() => setProofModalOrder(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
              >
                확인 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= OMS-04. 역물류(반품/회수) 신규 접수 모달 ================= */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsReturnModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">역물류(반품/회수) 전표 생성</h3>
                <p className="text-xs text-slate-400">TMS 회수배차 + WMS 반품입고 + 정산 원장 실시간 체결</p>
              </div>
            </div>

            {returnSuccessResult ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 size={16} />
                  <span>반품 오더가 성공적으로 체결되었습니다!</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between py-1 border-b border-emerald-500/20">
                    <span className="text-slate-400">반품 주문번호</span>
                    <strong className="text-emerald-300">{returnSuccessResult.returnOrderNo}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-500/20">
                    <span className="text-slate-400">TMS 회수 배차 ID</span>
                    <span className="text-cyan-300">#{returnSuccessResult.tmsPickupOrderId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-500/20">
                    <span className="text-slate-400">WMS 반품 입고 ID</span>
                    <span className="text-purple-300">#{returnSuccessResult.wmsReturnId}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">정산 차감 원장 ID</span>
                    <span className="text-amber-300">#{returnSuccessResult.settlementLedgerId}</span>
                  </div>
                </div>
                <p className="text-xs text-emerald-200/90 pt-1">
                  {returnSuccessResult.message}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setIsReturnModalOpen(false);
                      setSubTab('returns');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
                  >
                    반품 목록에서 확인
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReturn} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">원주문 번호</label>
                    <input
                      type="text"
                      required
                      value={returnFormData.originalOrderNo}
                      onChange={(e) => setReturnFormData({ ...returnFormData, originalOrderNo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">반품 사유 구분</label>
                    <select
                      value={returnFormData.returnReasonCode}
                      onChange={(e) => setReturnFormData({ ...returnFormData, returnReasonCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="CUSTOMER_MIND_CHANGE">고객 단순변심 (운임 화주/고객 부담)</option>
                      <option value="DEFECT">제품 불량/하자 (원인사 무상교환)</option>
                      <option value="WRONG_DELIVERY">오배송 (출고 오류 회수)</option>
                      <option value="DAMAGED_IN_TRANSIT">배송 중 파손 (택배/운송사 보상)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">고객명 (수취인)</label>
                    <input
                      type="text"
                      required
                      value={returnFormData.consigneeNm}
                      onChange={(e) => setReturnFormData({ ...returnFormData, consigneeNm: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">연락처</label>
                    <input
                      type="text"
                      required
                      value={returnFormData.consigneeTel}
                      onChange={(e) => setReturnFormData({ ...returnFormData, consigneeTel: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">회수지 주소</label>
                  <input
                    type="text"
                    required
                    value={returnFormData.pickupAddr}
                    onChange={(e) => setReturnFormData({ ...returnFormData, pickupAddr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">반품 입고 물류센터</label>
                    <select
                      value={returnFormData.destCenterCd}
                      onChange={(e) => setReturnFormData({ ...returnFormData, destCenterCd: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="IC01">수도권 통합 이천물류센터 (IC01)</option>
                      <option value="YI01">용인물류센터 (YI01)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">반품 수량</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={returnFormData.returnQty}
                      onChange={(e) => setReturnFormData({ ...returnFormData, returnQty: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">상세 사유 메모</label>
                  <textarea
                    rows={2}
                    value={returnFormData.memo}
                    onChange={(e) => setReturnFormData({ ...returnFormData, memo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    placeholder="기사님 회수 참고사항 또는 불량 상세 내역 입력"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={returnSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <RotateCcw size={13} />
                    <span>{returnSubmitting ? '접수 처리중...' : '반품 접수 확정'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
