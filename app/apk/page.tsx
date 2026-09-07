'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Truck, PackageSearch, Warehouse, Download, ArrowLeft, Copy, Check } from 'lucide-react';

const APPS = [
  {
    key: 'delivery',
    name: 'D2L 배송',
    desc: '배송 기사용 앱 — 배송 목록, 상차/완료 처리, 실시간 위치 전송',
    icon: Truck,
    url: 'https://app.dot2line.co.kr/apk/dot2line-delivery.apk',
  },
  {
    key: 'trans',
    name: 'D2L 수송',
    desc: '수송(B2B) 기사용 앱 — 수송 진행 상황 처리, 실시간 위치 전송',
    icon: PackageSearch,
    url: 'https://app.dot2line.co.kr/apk/dot2line-trans.apk',
  },
  {
    key: 'wms',
    name: 'D2L 창고',
    desc: '창고 작업자용 앱 — 입출고 검수, 피킹, 재고 처리',
    icon: Warehouse,
    url: 'https://app.dot2line.co.kr/apk/dot2line-wms.apk',
  },
];

export default function ApkDownloadPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white antialiased">
      <nav className="w-full border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            DOT2LINE
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-400 transition">
            <ArrowLeft size={16} /> 홈으로
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 break-keep">
            앱 다운로드
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto break-keep">
            안드로이드 기기에서 아래 버튼을 눌러 APK 파일을 내려받은 뒤 설치해 주세요.
            Play 스토어 정식 출시 전까지는 이 페이지를 통해 최신 버전을 받으실 수 있습니다.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {APPS.map((app) => {
            const Icon = app.icon;
            const copied = copiedKey === app.key;
            return (
              <div
                key={app.key}
                className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl"
              >
                <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                  <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Icon size={26} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold">{app.name}</h2>
                    <p className="text-xs sm:text-sm text-slate-400 break-keep">{app.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(app.key, app.url)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium text-xs sm:text-sm transition active:scale-95 whitespace-nowrap"
                  >
                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    {copied ? '복사됨' : '경로복사'}
                  </button>
                  <a
                    href={app.url}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold text-xs sm:text-sm transition active:scale-95 whitespace-nowrap"
                  >
                    <Download size={16} /> 다운로드
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-4 sm:p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <p className="text-xs sm:text-sm text-amber-200/80 break-keep">
            이미 앱이 설치되어 있는 경우, 새 버전 설치 전에 <strong>기존 앱을 삭제</strong>해야 할 수 있습니다.
            삭제 후 재설치하더라도 로그인 정보만 다시 입력하면 되고, 다른 데이터는 영향받지 않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
