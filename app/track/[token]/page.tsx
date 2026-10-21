'use client';

import React, { useEffect, useState, use } from 'react';
import TrackInquiry from './TrackInquiry';
import ParcelTrackSection, { ParcelTrackData } from './ParcelTrackSection';
import Link from 'next/link';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  Package,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Camera,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface DeliveryTrackData {
  orderId: number;
  orderNo: string;
  orgCode: string;
  orderStatus: string;
  orderStatusNm: string;
  consigneeNm: string;
  consigneeTel: string;
  addrM: string;
  addrD?: string;
  deliveryDt: string;
  deliveryReqMsg?: string;
  driverId?: number;
  driverNm?: string;
  driverHp?: string;
  carNo?: string;
  routeSeq?: number;
  currentDeliveringSeq?: number;
  remainingStops?: number;
  estimatedTime?: string;
  driverLat?: number;
  driverLng?: number;
  productSummary?: string;
  completedAt?: string;
  completeMemo?: string;
  receiptType?: string;
  hasPhotoProof?: boolean;
  photoIds?: number[];
  hasSignProof?: boolean;
  trackType?: 'DRIVER' | 'PARCEL';
  parcel?: ParcelTrackData;
}

export default function DeliveryTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [data, setData] = useState<DeliveryTrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<number | null>(null);

  const fetchTracking = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(token)}`, {
        cache: 'no-store',
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setErrorMsg(result.message || '배송 정보를 불러올 수 없습니다.');
      } else {
        setData(result.data);
      }
    } catch (e: any) {
      setErrorMsg('서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTracking();
    }
  }, [token]);

  // 진행 단계 계산
  const getStepStatus = (status?: string) => {
    if (!status) return 1;
    if (status === '9999') return 4; // 배송완료
    if (status === '7000') return 3; // 배송중
    if (['2000', '2010', '2020'].includes(status)) return 2; // 출고/준비중
    if (['8000', '8060', '8070'].includes(status)) return 0; // 보류/취소
    return 1; // 주문접수
  };

  const currentStep = getStepStatus(data?.orderStatus);
  // 택배 주문은 기사 순번·위치·완료사진이 없어 전용 조회 화면을 쓴다.
  const isParcel = data?.trackType === 'PARCEL' && !!data.parcel;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white antialiased pb-20">
      {/* 상단 네비게이션 */}
      <nav className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-1.5"
          >
            DOT2LINE
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTracking(true)}
              disabled={refreshing || loading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-indigo-400' : ''} />
            </button>
            <Link
              href="/track"
              className="text-xs text-slate-400 hover:text-indigo-400 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
            >
              조회하기
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {/* 로딩 상태 */}
        {loading && (
          <div className="py-24 text-center">
            <RefreshCw size={32} className="animate-spin text-indigo-400 mx-auto mb-4" />
            <p className="text-sm text-slate-400">실시간 배송 정보를 불러오는 중입니다...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {!loading && errorMsg && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 my-8">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-200">배송 조회를 완료할 수 없습니다</h2>
              <p className="text-xs text-slate-400 mt-1">{errorMsg}</p>
            </div>
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
            >
              주문번호로 직접 찾기 <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* 정상 데이터 렌더링 */}
        {!loading && data && (
          <>
            {isParcel && data.parcel && <ParcelTrackSection orderNo={data.orderNo} parcel={data.parcel} />}

            {!isParcel && (
              <>
            {/* 1. 핵심 배송 상태 헤더 카드 */}
            <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-slate-400">주문번호 {data.orderNo}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <ShieldCheck size={13} /> 안심 배송 조회
                </span>
              </div>

              {/* 상태 메시지 대형 타이틀 */}
              <div className="mb-6">
                {currentStep === 4 ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-white">배송이 완료되었습니다</h1>
                      <p className="text-xs text-slate-400 mt-0.5">{data.completedAt || data.deliveryDt} 배송 완료</p>
                    </div>
                  </div>
                ) : currentStep === 3 ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Truck size={22} className="animate-pulse" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-white">고객님 댁으로 배송 중입니다</h1>
                      <p className="text-xs text-indigo-300 mt-0.5">
                        {data.remainingStops === 0
                          ? '곧 도착 예정입니다! (다음 배송 차례)'
                          : `앞선 배송 ${data.remainingStops}가구 남음`}
                      </p>
                    </div>
                  </div>
                ) : currentStep === 2 ? (
                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white">상품을 준비하고 있습니다</h1>
                    <p className="text-xs text-slate-400 mt-0.5">센터에서 검수 및 상차 준비 중입니다.</p>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white">주문이 접수되었습니다</h1>
                    <p className="text-xs text-slate-400 mt-0.5">배송 일정을 조율하고 있습니다.</p>
                  </div>
                )}
              </div>

              {/* 타임라인 프로그레스 바 */}
              <div className="pt-2 pb-1">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { step: 1, label: '주문접수' },
                    { step: 2, label: '상품준비' },
                    { step: 3, label: '배송출발' },
                    { step: 4, label: '배송완료' },
                  ].map((s) => {
                    const isDone = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div key={s.step} className="flex flex-col items-center">
                        <div
                          className={`w-full h-1.5 rounded-full mb-2 transition-colors ${
                            isDone ? 'bg-indigo-500' : 'bg-slate-800'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            isCurrent
                              ? 'text-indigo-400 font-bold'
                              : isDone
                              ? 'text-slate-300'
                              : 'text-slate-600'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. 실시간 도착 정보 하이라이트 카드 (배송중일 때) */}
            {currentStep === 3 && (
              <div className="p-5 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Clock size={14} /> 실시간 배송 현황
                  </span>
                  {data.routeSeq && (
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                      고객님 배송 순번: {data.routeSeq}차
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 mb-1">내 앞 잔여 배송</p>
                    <p className="text-lg font-extrabold text-white">
                      {data.remainingStops === 0 ? (
                        <span className="text-emerald-400">곧 도착 (다음 차례)</span>
                      ) : (
                        `${data.remainingStops ?? '-'} 가구`
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 mb-1">예상 도착 시간</p>
                    <p className="text-lg font-extrabold text-white">
                      {data.estimatedTime || '금일 중 도착'}
                    </p>
                  </div>
                </div>

                {/* 기사 실시간 위치 좌표가 있는 경우 */}
                {data.driverLat && data.driverLng && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                    <MapPin size={13} className="text-indigo-400 shrink-0" />
                    <span>배송 기사님이 실시간 위치 정보를 전송하고 있습니다.</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. 배송 완료 증빙 카드 (완료 시) */}
            {currentStep === 4 && (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera size={15} className="text-emerald-400" /> 배송 완료 증빙
                  </h3>
                  {data.completedAt && (
                    <span className="text-xs text-slate-400">{data.completedAt}</span>
                  )}
                </div>

                {data.completeMemo && (
                  <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    배송 메시지: {data.completeMemo}
                  </p>
                )}

                {/* 배송 사진 갤러리 */}
                {data.photoIds && data.photoIds.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {data.photoIds.map((photoId, idx) => (
                      <button
                        key={photoId}
                        onClick={() => setActivePhoto(photoId)}
                        className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 hover:border-indigo-500 transition group"
                      >
                        <img
                          src={`/api/track/${encodeURIComponent(token)}/photo/${photoId}`}
                          alt={`배송 사진 ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <ExternalLink size={16} className="text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. 배송 기사 정보 카드 */}
            {data.driverNm && (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User size={14} /> 담당 배송 기사 정보
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
                      {data.driverNm.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{data.driverNm}</p>
                      <p className="text-xs text-slate-400">{data.carNo || '배송 차량'}</p>
                    </div>
                  </div>
                  {data.driverHp && data.driverHp !== '-' && (
                    <a
                      href={`tel:${data.driverHp.replace(/-/g, '')}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold transition active:scale-95"
                    >
                      <Phone size={13} /> 기사님 연락
                    </a>
                  )}
                </div>
              </div>
            )}

              </>
            )}

            {/* 5. 배송지 및 주문 정보 카드 */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5 text-xs">
              <h3 className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} /> 배송 정보
              </h3>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">받는 분</span>
                  <span className="text-slate-200 font-medium">{data.consigneeNm}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">연락처</span>
                  <span className="text-slate-200 font-medium">{data.consigneeTel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 shrink-0">배송지 주소</span>
                  <span className="text-slate-200 font-medium text-right ml-4">
                    {data.addrM} {data.addrD || ''}
                  </span>
                </div>
                {data.productSummary && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400 shrink-0">배송 상품</span>
                    <span className="text-slate-200 font-medium text-right ml-4 break-keep">
                      {data.productSummary}
                    </span>
                  </div>
                )}
                {data.deliveryReqMsg && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 shrink-0">배송 요청사항</span>
                    <span className="text-slate-300 font-medium text-right ml-4 break-keep">
                      {data.deliveryReqMsg}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 6. 문의하기(수취인이 로그인 없이 남김) */}
            <TrackInquiry token={token} />

            {/* 하단 안심 안내 */}
            <div className="text-center py-4">
              <p className="text-[11px] text-slate-500">
                개인정보 보호를 위해 고객님의 일부 정보는 마스킹 처리되어 제공됩니다.
              </p>
            </div>
          </>
        )}
      </main>

      {/* 사진 확대 모달 */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full flex items-center justify-center">
            <img
              src={`/api/track/${encodeURIComponent(token)}/photo/${activePhoto}`}
              alt="배송 완료 사진 원본"
              className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
