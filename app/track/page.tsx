'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Package, AlertCircle, ShieldCheck } from 'lucide-react';

export default function TrackSearchPage() {
  const router = useRouter();
  const [orderNo, setOrderNo] = useState('');
  const [telLast4, setTelLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNo.trim()) {
      setErrorMsg('주문번호(송장번호)를 입력해 주세요.');
      return;
    }
    if (!telLast4.trim() || telLast4.trim().length !== 4) {
      setErrorMsg('수취인 전화번호 뒤 4자리를 정확히 입력해 주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/track/search?orderNo=${encodeURIComponent(orderNo.trim())}&telLast4=${encodeURIComponent(telLast4.trim())}`
      );
      const result = await res.json();
      if (!res.ok || !result.success) {
        setErrorMsg(result.message || '일치하는 배송 건을 찾을 수 없습니다.');
      } else if (result.token) {
        // 발급된 보안 토큰 URL로 이동
        router.push(`/track/${result.token}`);
      }
    } catch (err) {
      setErrorMsg('배송 조회 서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white antialiased">
      <nav className="w-full border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent"
          >
            DOT2LINE
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-400 transition">
            <ArrowLeft size={16} /> 홈으로
          </Link>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 pt-12 pb-24">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">
            <Package size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">실시간 배송 조회</h1>
          <p className="text-xs text-slate-400 break-keep">
            받으신 알림톡의 링크를 클릭하시거나, 아래에 주문번호와 전화번호 뒤 4자리를 입력하시면 실시간 배송 현황을 확인하실 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSearch} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              주문번호 (또는 송장번호)
            </label>
            <input
              type="text"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="예: ORD-20261007-0001"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              수취인 전화번호 뒤 4자리
            </label>
            <input
              type="text"
              maxLength={4}
              value={telLast4}
              onChange={(e) => setTelLast4(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="예: 1234"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>조회 중...</span>
            ) : (
              <>
                <Search size={16} /> 배송 조회하기
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>개인정보 보호를 위해 상세 정보는 암호화되어 안전하게 조회됩니다.</span>
        </div>
      </main>
    </div>
  );
}
