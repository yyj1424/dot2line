'use client';

import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Package,
  ExternalLink,
  AlertCircle,
  Copy,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export interface ParcelStep {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
  at?: string | null;
}

export interface ParcelEvent {
  at?: string | null;
  state?: string | null;
  stateNm?: string | null;
  text?: string | null;
}

export interface ParcelBox {
  seq?: number | null;
  invoiceNo: string;
  carrierNm: string;
  state: string;
  stateNm: string;
  lastEventText?: string | null;
  lastEventAt?: string | null;
  deliveredAt?: string | null;
  trackUrl?: string | null;
  events: ParcelEvent[];
}

export interface ParcelTrackData {
  stage: string;
  stageNm: string;
  steps: ParcelStep[];
  boxes: ParcelBox[];
  boxCount: number;
  deliveredCount: number;
}

const STAGE_HINT: Record<string, string> = {
  RECEIVED: '주문이 접수되었습니다. 상품 준비가 시작되면 안내드립니다.',
  PREPARING: '상품을 포장해 택배사에 보낼 준비를 하고 있습니다.',
  SHIPPED: '택배사에 인계되었습니다. 집하가 끝나면 배송이 시작됩니다.',
  IN_TRANSIT: '상품이 택배사를 통해 이동하고 있습니다.',
  OUT_FOR_DELIVERY: '배송 기사님이 배송을 출발했습니다. 오늘 도착 예정입니다.',
  DELIVERED: '배송이 완료되었습니다. 이용해 주셔서 감사합니다.',
  EXCEPTION: '배송 중 확인이 필요한 건이 있습니다. 택배사 조회를 확인하시거나 아래 문의하기를 이용해 주세요.',
  CANCELLED: '취소된 주문입니다.',
};

/** 택배 주문 전용 배송조회: 단계 타임라인 + 박스(송장)별 상태·이력·택배사 조회 링크. */
export default function ParcelTrackSection({ orderNo, parcel }: { orderNo: string; parcel: ParcelTrackData }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* 복사 권한이 없는 브라우저에서는 번호를 눈으로 확인할 수 있으므로 조용히 넘어간다 */
    }
  };

  const delivered = parcel.stage === 'DELIVERED';
  const exception = parcel.stage === 'EXCEPTION';
  const cancelled = parcel.stage === 'CANCELLED';
  const lastStepAt = [...parcel.steps].reverse().find((s) => s.at)?.at;

  return (
    <>
      {/* 1. 핵심 상태 헤더 + 단계 */}
      <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-slate-400">주문번호 {orderNo}</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <ShieldCheck size={13} /> 안심 배송 조회
          </span>
        </div>

        <div className="flex items-center gap-2.5 mb-6">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              delivered
                ? 'bg-emerald-500/20 text-emerald-400'
                : exception || cancelled
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-indigo-500/20 text-indigo-400'
            }`}
          >
            {delivered ? (
              <CheckCircle2 size={22} />
            ) : exception || cancelled ? (
              <AlertCircle size={22} />
            ) : parcel.stage === 'IN_TRANSIT' || parcel.stage === 'OUT_FOR_DELIVERY' ? (
              <Truck size={22} className="animate-pulse" />
            ) : (
              <Package size={22} />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">{parcel.stageNm}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{STAGE_HINT[parcel.stage] || ''}</p>
            {delivered && lastStepAt && <p className="text-xs text-emerald-400 mt-0.5">{lastStepAt} 배송 완료</p>}
          </div>
        </div>

        {!cancelled && (
          <div className="grid grid-cols-5 gap-1.5 text-center" aria-label="배송 단계">
            {parcel.steps.map((s) => (
              <div key={s.key} className="flex flex-col items-center">
                <div className={`w-full h-1.5 rounded-full mb-2 transition-colors ${s.done || s.current ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                <span
                  className={`text-[11px] sm:text-xs font-medium break-keep ${
                    s.current ? 'text-indigo-400 font-bold' : s.done ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {s.label}
                </span>
                {s.at && <span className="text-[10px] text-slate-500 mt-0.5">{s.at.length > 10 ? s.at.slice(5) : s.at}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 박스(송장)별 현황 */}
      {parcel.boxes.length > 0 && (
        <div className="space-y-3">
          {parcel.boxCount > 1 && (
            <p className="text-xs text-slate-400 px-1">
              총 {parcel.boxCount}개 상자 중 <span className="text-slate-200 font-semibold">{parcel.deliveredCount}개</span> 배송 완료
            </p>
          )}
          {parcel.boxes.map((b, i) => (
            <div key={`${b.invoiceNo}-${i}`} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">{b.carrierNm || '택배사'}</p>
                  <p className="text-base font-bold text-white break-all">{b.invoiceNo}</p>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    b.state === 'DELIVERED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : b.state === 'EXCEPTION'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  }`}
                >
                  {b.stateNm}
                </span>
              </div>

              {b.lastEventText && (
                <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {b.lastEventAt && <span className="text-slate-500 mr-1.5">{b.lastEventAt}</span>}
                  {b.lastEventText}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {b.invoiceNo && (
                  <button
                    onClick={() => copy(b.invoiceNo)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition active:scale-95"
                  >
                    <Copy size={13} /> {copied === b.invoiceNo ? '복사됨' : '송장번호 복사'}
                  </button>
                )}
                {b.trackUrl && (
                  <a
                    href={b.trackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition active:scale-95"
                  >
                    <ExternalLink size={13} /> 택배사에서 조회
                  </a>
                )}
              </div>

              {b.events.length > 0 && (
                <ol className="pt-1 space-y-2 border-l border-slate-800 ml-1.5">
                  {[...b.events].reverse().map((e, k) => (
                    <li key={k} className="pl-3 relative">
                      <span className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${k === 0 ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                      <p className="text-xs text-slate-200 font-medium">{e.stateNm || e.state}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock size={10} /> {e.at}
                        {e.text ? <span className="text-slate-400 ml-1">· {e.text}</span> : null}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
