import React from 'react';
import Link from 'next/link';
import { ArrowRight, Box, Truck, BarChart3, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white antialiased">
      {/* 1. 네비게이션 */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            DOT2LINE
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/login" 
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium hover:text-indigo-400 transition"
            >
              로그인
            </Link>
            <Link 
              href="/signup" 
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 rounded-lg transition whitespace-nowrap shadow-sm shadow-indigo-500/20"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. 메인 홍보 섹션 (Hero) */}
      <header className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* 배경 은은한 방사형 글로우 효과 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[320px] sm:h-[600px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 mb-6 border border-indigo-500/30 rounded-full bg-indigo-500/10 text-indigo-400 text-xs sm:text-sm font-medium break-keep">
            로지스틱스의 새로운 기준, 2026 물류 트렌드
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight sm:leading-tight break-keep">
            흩어진 점들을 연결하여<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              물류의 선형적 가치
            </span>를 만듭니다
          </h1>
          
          <p className="text-sm sm:text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed break-keep px-2">
            기준정보(MDM)부터 창고(WMS), 배송(TMS), 정산까지.<br className="hidden sm:inline" />
            데이터의 끊김 없는 흐름으로 귀사의 물류를 혁신하세요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition hover:scale-[1.02] shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              무료로 사용해 보기 <ArrowRight size={18} />
            </Link>
            <button 
              type="button"
              className="w-full sm:w-auto px-7 py-3.5 border border-slate-700 hover:bg-slate-900 rounded-full font-bold text-base sm:text-lg transition active:scale-95 text-slate-300 hover:text-white"
            >
              솔루션 소개서 받기
            </button>
          </div>
        </div>
      </header>

      {/* 3. 광고 섹션 (상단) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="w-full p-4 sm:p-5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 group cursor-pointer hover:border-indigo-500/40 transition text-center sm:text-left">
          <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] sm:text-xs uppercase tracking-widest font-semibold">
            AD
          </span>
          <p className="text-slate-300 text-xs sm:text-sm font-medium break-keep">
            물류 보험의 새로운 혁신, 지금 가입하고 첫 달 무료 혜택을 받으세요
          </p>
        </div>
      </section>

      {/* 4. 핵심 기능 (Features) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Users className="text-indigo-400" size={24} />}
            title="통합 기준정보 (MDM)"
            desc="전사 물류 인프라 데이터를 단일화하여 데이터 정합성을 보장합니다."
          />
          <FeatureCard 
            icon={<Box className="text-purple-400" size={24} />}
            title="지능형 창고 관리 (WMS)"
            desc="재고의 입출고 흐름을 실시간으로 추적하고 로케이션을 최적화합니다."
          />
          <FeatureCard 
            icon={<Truck className="text-cyan-400" size={24} />}
            title="수송/배송 관리 (TMS)"
            desc="최적의 배차 경로와 실시간 GPS 관제로 배송 효율을 극대화합니다."
          />
        </div>
      </section>

      {/* 5. 무료 제공 선언 (Free Policy) */}
      <section className="bg-gradient-to-b from-indigo-600 to-indigo-700 py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 break-keep leading-tight">
            "왜 이 강력한 시스템이 무료인가요?"
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base md:text-lg mb-8 leading-relaxed break-keep">
            우리는 물류 데이터가 더 많이 모일수록 더 큰 가치가 생긴다고 믿습니다.<br className="hidden sm:inline" />
            비싼 구축 비용 대신, 모두가 함께 성장하는 플랫폼을 꿈꿉니다.
          </p>
          <Link 
            href="/signup" 
            className="inline-block w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-white text-indigo-600 rounded-full font-bold text-base sm:text-lg hover:bg-slate-100 transition shadow-md active:scale-95"
          >
            지금 바로 가입하기
          </Link>
        </div>
      </section>

      {/* 6. 광고 섹션 (하단) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="w-full max-w-3xl mx-auto p-6 sm:p-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <span className="text-[10px] sm:text-xs text-slate-500 block mb-2 font-mono tracking-wider">
            SPONSORED
          </span>
          <h3 className="text-base sm:text-xl font-bold text-slate-200 break-keep">
            물류 창고 공실 해결을 위한 가장 빠른 방법
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 break-keep">
            지금 바로 물류창고 임대 정보 서비스를 무료로 확인해 보세요.
          </p>
        </div>
      </section>

      {/* 7. 푸터 */}
      <footer className="border-t border-slate-900 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-slate-500">
          <p>© 2026 DOT2LINE. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-slate-300 transition">이용약관</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 sm:p-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition flex flex-col items-start">
      <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-800/70 border border-slate-700/50 rounded-xl flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-100 break-keep">{title}</h3>
      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed break-keep">{desc}</p>
    </div>
  );
}