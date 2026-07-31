import React from 'react';
import Link from 'next/link';
import { ArrowRight, Box, Truck, BarChart3, Users, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* 1. 네비게이션 */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            DOT2LINE
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400 transition">로그인</Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">무료로 시작하기</Link>
          </div>
        </div>
      </nav>

      {/* 2. 메인 홍보 섹션 (Hero) */}
      <header className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* 배경 점선 효과 */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fe_px,transparent_px)] [background-size:px_px]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 mb-6 border border-indigo-500/30 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium animate-fade-in">
            로지스틱스의 새로운 기준, 2026 물류 트렌드
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-">
            흩어진 점들을 연결하여<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              물류의 선형적 가치
            </span>를 만듭니다
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            기준정보(MDM)부터 창고(WMS), 배송(TMS), 정산까지.<br />
            데이터의 끊김 없는 흐름으로 귀사의 물류를 혁신하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105">
              무료로 사용해 보기 <ArrowRight size={20} />
            </Link>
            <button className="px-8 py-4 border border-slate-700 hover:bg-slate-800 rounded-full font-bold text-lg">
              솔루션 소개서 받기
            </button>
          </div>
        </div>
      </header>

      {/* 3. 광고 섹션 (상단) */}
      <section className="max-w-7xl mx-auto px-6 py-4">
        <div className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center group cursor-pointer hover:border-indigo-500/50 transition">
          <span className="text-slate-500 text-xs uppercase tracking-widest mr-4">AD</span>
          <p className="text-slate-400 font-medium">물류 보험의 새로운 혁신, 지금 가입하고 첫 달 무료 혜택을 받으세요</p>
        </div>
      </section>

      {/* 4. 핵심 기능 (Features) */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Users className="text-indigo-400" />}
            title="통합 기준정보 (MDM)"
            desc="전사 물류 인프라 데이터를 단일화하여 데이터 정합성을 보장합니다."
          />
          <FeatureCard 
            icon={<Box className="text-purple-400" />}
            title="지능형 창고 관리 (WMS)"
            desc="재고의 입출고 흐름을 실시간으로 추적하고 로케이션을 최적화합니다."
          />
          <FeatureCard 
            icon={<Truck className="text-cyan-400" />}
            title="수송/배송 관리 (TMS)"
            desc="최적의 배차 경로와 실시간 GPS 관제로 배송 효율을 극대화합니다."
          />
        </div>
      </section>

      {/* 5. 무료 제공 선언 (Free Policy) */}
      <section className="bg-indigo-600 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">"왜 이 강력한 시스템이 무료인가요?"</h2>
          <p className="text-indigo-100 text-lg mb-8">
            우리는 물류 데이터가 더 많이 모일수록 더 큰 가치가 생긴다고 믿습니다.<br />
            비싼 구축 비용 대신, 모두가 함께 성장하는 플랫폼을 꿈꿉니다.
          </p>
          <Link href="/signup" className="inline-block px-10 py-4 bg-white text-indigo-600 rounded-full font-bold text-xl hover:bg-slate-100 transition">
            지금 바로 가입하기
          </Link>
        </div>
      </section>

      {/* 6. 광고 섹션 (하단) */}
      <section className="max-w-7xl mx-auto px-6 py-12 text-center">
        <div className="inline-block w-full max-w-4xl p-10 bg-slate-900 border border-dashed border-slate-700 rounded-2xl">
          <span className="text-xs text-slate-500 block mb-2 font-mono">SPONSORED</span>
          <h3 className="text-xl font-bold text-slate-300">물류 창고 공실 해결을 위한 가장 빠른 방법</h3>
          <p className="text-slate-500 mt-2">지금 바로 물류창고 임대 정보 서비스를 무료로 확인해 보세요.</p>
        </div>
      </section>

      {/* 7. 푸터 */}
      <footer className="border-t border-slate-900 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-60">
          <p>© 2026 DOT2LINE. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0 text-sm">
            <Link href="/privacy">개인정보처리방침</Link>
            <Link href="/terms">이용약관</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition group">
      <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
