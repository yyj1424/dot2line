'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Truck, BarChart3, Users, ExternalLink, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // 8080 레거시/실무 시스템 호출 전용 함수 (버튼 클릭 시에만 동작)
  const handleOpenSpringService = async (servicePath: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
      router.push('/login');
      return;
    }

    const accessToken = session.access_token;
    const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://192.168.211.230:8080';

    // 토큰을 파라미터로 넘기며 8080 서비스 새 탭으로 실행
    const targetUrl = `${springApiUrl}/sso/login?token=${encodeURIComponent(accessToken)}&redirect=${encodeURIComponent(servicePath)}`;
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* 1. 사이드바 (Next.js 내부 라우팅 전용) */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
            DOT2LINE Logistics SCM
          </div>

          <nav className="space-y-1.5">
            {/* 메뉴를 누르면 Next.js 내부 페이지로 자연스럽게 이동 */}
            <SidebarLink href="/dashboard" icon={<BarChart3 size={18} />} text="종합 관제 대시보드" active />
            <SidebarLink href="/dashboard/mdm" icon={<Users size={18} />} text="통합 기준정보 (MDM)" />
            <SidebarLink href="/dashboard/wms" icon={<Box size={18} />} text="창고 관리 (WMS)" />
            <SidebarLink href="/dashboard/tms" icon={<Truck size={18} />} text="수배송 관리 (TMS)" />
          </nav>
        </div>
      </aside>

      {/* 2. 메인 화면 영역 */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">수배송 관리 (TMS) 현황</h1>
            <p className="text-sm text-slate-400">실시간 배차 현황 및 운송 데이터를 한눈에 확인합니다.</p>
          </div>
          
          {/* ★ 핵심: 실제 '일'을 하러 8080 시스템으로 넘어가는 전용 실행 버튼 ★ */}
          <button
            onClick={() => handleOpenSpringService('/index2')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition hover:scale-105"
          >
            <span>시스템 열기</span>
            <ExternalLink size={16} />
          </button>
        </header>

        {/* 대시보드 내에서는 가볍게 현황 지표 및 요약 정보만 조회 */}
        <section className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-sm">오늘의 배차 건수</p>
            <p className="text-3xl font-bold mt-2">128 건</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-sm">운행 중 차량</p>
            <p className="text-3xl font-bold mt-2 text-indigo-400">42 대</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-sm">배송 완료율</p>
            <p className="text-3xl font-bold mt-2 text-emerald-400">94.2%</p>
          </div>
        </section>
      </main>
    </div>
  );
}

// 사이드바 링크 컴포넌트 (Next.js Link 활용)
function SidebarLink({ href, icon, text, active = false }: { href: string; icon: React.ReactNode; text: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
        active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {icon}
      {text}
    </Link>
  );
}