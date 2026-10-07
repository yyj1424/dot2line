'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck, Navigation, Phone, Camera, Check, ShieldCheck,
  MapPin, ArrowLeft, RefreshCw, PenTool, Trash2, CheckCircle2,
  AlertCircle, Sparkles, ExternalLink, Image as ImageIcon, ChevronRight
} from 'lucide-react';

interface DriverOrder {
  orderNo: string;
  consigneeNm: string;
  consigneeTel: string;
  deliveryAddr: string;
  productNm: string;
  deliveryReqMsg: string;
  status: '7000' | '9999';
  statusNm: string;
  stopSeq: number;
}

export default function DriverPodPage() {
  const router = useRouter();

  // 배송 기사 오늘의 배송 목록
  const [orders, setOrders] = useState<DriverOrder[]>([
    {
      orderNo: 'ORD-20261007-0012',
      consigneeNm: '홍*동',
      consigneeTel: '010-3849-1234',
      deliveryAddr: '서울특별시 송파구 올림픽로 300 롯데월드타워 14층',
      productNm: '프리미엄 원목 4인 다이닝 세트',
      deliveryReqMsg: '부재 시 문앞에 놓아주시고 사진 전송해 주세요.',
      status: '7000',
      statusNm: '배송중 (7000)',
      stopSeq: 1,
    },
    {
      orderNo: 'ORD-20261007-0011',
      consigneeNm: '김*수',
      consigneeTel: '010-8271-9999',
      deliveryAddr: '서울특별시 서초구 강남대로 381 102동 1403호',
      productNm: '인체공학 메시 사무용 체어 2개',
      deliveryReqMsg: '배송 전 연락 부탁드립니다.',
      status: '9999',
      statusNm: '배송완료 (9999)',
      stopSeq: 2,
    },
    {
      orderNo: 'ORD-20261007-0010',
      consigneeNm: '이*진',
      consigneeTel: '010-9124-5555',
      deliveryAddr: '경기도 성남시 분당구 판교역로 166 8동 502호',
      productNm: '스마트 높낮이 조절 데스크 1400',
      deliveryReqMsg: '경비실 보관 부탁드립니다.',
      status: '9999',
      statusNm: '배송완료 (9999)',
      stopSeq: 3,
    },
  ]);

  const [selectedOrderNo, setSelectedOrderNo] = useState<string>('ORD-20261007-0012');
  const selectedOrder = orders.find((o) => o.orderNo === selectedOrderNo) || orders[0];

  // POD 수령 방식 및 증빙 상태
  const [dropLocation, setDropLocation] = useState<'DOOR_NON_FACE' | 'FACE_TO_FACE' | 'SECURITY_OFFICE' | 'DELIVERY_LOCKER'>('DOOR_NON_FACE');
  const [completeMemo, setCompleteMemo] = useState('현관 문앞 비대면 안전 배송 완료');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 전자 서명 캔버스 상태
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // 캔버스 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [selectedOrderNo]);

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

  // 비대면 수령 시 자동 전자서명 대체
  const handleAutoSignNonFace = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('✓ 비대면 문앞 수령 확인', 30, 45);
    setHasSignature(true);
  };

  // 모의 현장 사진 자동 등록 (PC 브라우저 테스트 편의)
  const handleMockPhoto = () => {
    setPhotoPreview('/img/sample-pod.jpg');
  };

  // 비프음 헬퍼
  const playCompleteChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // 무시
    }
  };

  // 배송완료 POD 제출
  const handleCompleteDelivery = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/driver/pod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: selectedOrder.orderNo,
          dropLocation,
          recipientNm: selectedOrder.consigneeNm,
          completeMemo,
          driverLat: 37.4979,
          driverLng: 127.0276,
          driverNm: '김진철 기사',
          carNo: '서울98바1234',
        }),
      });
      const data = await res.json();

      if (data.success) {
        playCompleteChime();
        setSuccessMessage(data.message);

        // 목록 상태 9999로 즉시 갱신
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNo === selectedOrder.orderNo
              ? { ...o, status: '9999', statusNm: '배송완료 (9999)' }
              : o
          )
        );
      } else {
        alert(data.message || '배송완료 처리에 실패했습니다.');
      }
    } catch {
      alert('배송완료 처리 서버와 통신할 수 없습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = orders.filter((o) => o.status === '9999').length;
  const progressPercent = Math.round((completedCount / orders.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white pb-12">
      {/* 상단 기사 헤더 */}
      <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800 px-4 h-14 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link href="/apk" className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Truck size={16} />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-extrabold text-white">D2L 기사용 웹 POD</h1>
              <p className="text-[10px] text-slate-400 font-mono">김진철 기사 (서울98바1234)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            배송 완료 {completedCount}/{orders.length} ({progressPercent}%)
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {/* 오늘의 정류지 선택 바 */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-slate-300 block">오늘의 배송 목록 (경유지 선택)</span>
          <div className="space-y-1.5">
            {orders.map((ord) => {
              const isSelected = ord.orderNo === selectedOrderNo;
              const isDone = ord.status === '9999';
              return (
                <button
                  key={ord.orderNo}
                  onClick={() => {
                    setSelectedOrderNo(ord.orderNo);
                    setSuccessMessage(null);
                    setPhotoPreview(null);
                    clearSignature();
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex justify-between items-center ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                      {ord.stopSeq}
                    </span>
                    <div className="truncate">
                      <strong className="text-white block">{ord.consigneeNm} 고객님</strong>
                      <span className="text-[10px] text-slate-400 truncate block">{ord.deliveryAddr}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-2 ${
                      isDone
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {isDone ? '완료' : '배송중'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 주문의 상세 정보 카드 */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-indigo-400 font-mono font-semibold">{selectedOrder.orderNo}</span>
              <h2 className="text-base font-bold text-white mt-0.5">{selectedOrder.consigneeNm} 고객님 배송지</h2>
            </div>
            <a
              href={`tel:${selectedOrder.consigneeTel}`}
              className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1 shrink-0"
            >
              <Phone size={13} />
              <span>전화걸기</span>
            </a>
          </div>

          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs space-y-1">
            <p className="text-slate-300 font-medium">{selectedOrder.deliveryAddr}</p>
            <p className="text-slate-400 text-[11px]">품목: {selectedOrder.productNm}</p>
            <p className="text-indigo-300 text-[11px]">요청: {selectedOrder.deliveryReqMsg}</p>
          </div>
        </div>

        {/* 배송 완료 처리 폼 (POD 입력) */}
        {selectedOrder.status !== '9999' ? (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-xs">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Camera size={16} className="text-emerald-400" /> 현장 전자 인수증 (POD) 작성
            </h3>

            {/* 수령 방식 선택 라디오 필 */}
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">수령 방식 선택</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'DOOR_NON_FACE', label: '현관 앞 비대면' },
                  { key: 'FACE_TO_FACE', label: '직접 수령 (대면)' },
                  { key: 'SECURITY_OFFICE', label: '경비실 보관' },
                  { key: 'DELIVERY_LOCKER', label: '무인 택배함' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setDropLocation(item.key as any);
                      if (item.key === 'DOOR_NON_FACE') {
                        setCompleteMemo('현관 문앞 비대면 안전 배송 완료');
                        handleAutoSignNonFace();
                      } else if (item.key === 'SECURITY_OFFICE') {
                        setCompleteMemo('경비실 인계 보관 완료');
                      }
                    }}
                    className={`py-2 rounded-xl font-semibold border transition ${
                      dropLocation === item.key
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 현장 증빙 사진 촬영/업로드 */}
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">배송 현장 사진 증빙</label>
              {photoPreview ? (
                <div className="relative w-full h-40 bg-slate-950 rounded-xl overflow-hidden border border-emerald-500/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="현장 사진 미리보기" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-slate-700 bg-slate-950/60 rounded-xl p-4 text-center space-y-2">
                  <Camera size={24} className="mx-auto text-indigo-400 opacity-80" />
                  <p className="text-xs text-slate-300">문앞 배송 사진을 촬영하거나 첨부해 주세요</p>
                  <div className="flex justify-center gap-2 pt-1">
                    <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer transition">
                      <span>사진 촬영</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const url = URL.createObjectURL(e.target.files[0]);
                            setPhotoPreview(url);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleMockPhoto}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    >
                      모의 사진 등록
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 고객 전자 서명 패드 (HTML5 터치 캔버스) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-400 font-medium flex items-center gap-1">
                  <PenTool size={13} className="text-indigo-400" /> 고객 서명 / 수령인 확인
                </label>
                <div className="flex gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={handleAutoSignNonFace}
                    className="text-indigo-400 hover:underline"
                  >
                    비대면 자동서명
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
                  width={380}
                  height={80}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-20 touch-none cursor-crosshair"
                />
              </div>
            </div>

            {/* 현장 비고 메모 */}
            <div>
              <label className="text-slate-400 block mb-1 font-medium">현장 배송 메모</label>
              <input
                type="text"
                value={completeMemo}
                onChange={(e) => setCompleteMemo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>

            {/* 제출 버튼 */}
            <button
              onClick={handleCompleteDelivery}
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? '배송 완료 처리중...' : '배송 완료 확정 (POD 제출)'}</span>
            </button>
          </div>
        ) : (
          <div className="p-5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-center space-y-2">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">해당 가구는 배송이 완료되었습니다</h3>
            <p className="text-xs text-emerald-200/80">
              현장 사진 증빙 및 비대면 인수증이 전사 OMS에 실시간 등록되었습니다.
            </p>
            <div className="pt-2">
              <button
                onClick={() => router.push(`/track/DEV_ORG01_10520`)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                고객용 배송 조회 화면 보기
              </button>
            </div>
          </div>
        )}

        {/* 성공 피드백 배너 */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </main>
    </div>
  );
}
