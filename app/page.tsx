import React from 'react';
import Link from 'next/link';
import { ArrowRight, Box, Truck, BarChart3, Users, ShieldCheck, Lock, KeyRound, Smartphone, PackageSearch, ClipboardCheck } from 'lucide-react';

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
            <a
              href="#faq"
              className="w-full sm:w-auto px-7 py-3.5 border border-slate-700 hover:bg-slate-900 rounded-full font-bold text-base sm:text-lg transition active:scale-95 text-slate-300 hover:text-white text-center"
            >
              더 알아보기
            </a>
          </div>
        </div>
      </header>

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

      {/* 4.1 현장용 모바일 앱 (Mobile Apps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 border border-slate-800 rounded-full bg-slate-900/60 text-slate-400 text-xs sm:text-sm font-medium">
            <Smartphone size={14} />
            관리자 화면뿐만 아니라
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 break-keep">현장 인력도 전용 앱으로 연결됩니다</h2>
          <p className="text-slate-400 text-sm sm:text-base break-keep">수송·배송 기사부터 창고 작업자까지, 각자의 업무에 맞춘 모바일 앱을 제공합니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Truck className="text-indigo-400" size={24} />}
            title="수송 기사 앱"
            desc="배차 목록과 상·하차지 정보를 확인하고, 입차부터 수송완료까지 단계별로 처리합니다. 실시간 위치 전송으로 도착 여부를 자동 확인합니다."
          />
          <FeatureCard
            icon={<PackageSearch className="text-purple-400" size={24} />}
            title="배송 기사 앱"
            desc="오늘의 배송 목록과 상차 스캔, 배송완료·연기·취소·반품회수까지 현장에서 바로 처리합니다."
          />
          <FeatureCard
            icon={<ClipboardCheck className="text-cyan-400" size={24} />}
            title="창고 작업자 앱(WMS)"
            desc="입고·피킹·출고 작업 지시를 스캔 기반으로 확인하고 처리 결과를 실시간으로 반영합니다."
          />
        </div>
      </section>

      {/* 4.2 보안 (Security) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-10">
          <div className="flex items-center gap-2 mb-8 sm:mb-10 justify-center">
            <ShieldCheck className="text-emerald-400" size={22} />
            <h2 className="text-xl sm:text-2xl font-bold break-keep">안심하고 맡기셔도 됩니다</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <SecurityItem
              icon={<Lock className="text-emerald-400" size={20} />}
              title="개인정보 암호화 저장"
              desc="연락처, 주소 등 개인정보는 암호화된 상태로 저장되어 원본 데이터가 그대로 노출되지 않습니다."
            />
            <SecurityItem
              icon={<KeyRound className="text-emerald-400" size={20} />}
              title="회사별 데이터 완전 분리"
              desc="조직 단위로 데이터가 분리되어 저장되며, 다른 회사는 서로의 데이터를 조회할 수 없습니다."
            />
            <SecurityItem
              icon={<ShieldCheck className="text-emerald-400" size={20} />}
              title="화면·기능별 권한 관리"
              desc="담당자 역할에 따라 조회·저장·삭제 권한을 세밀하게 설정할 수 있습니다."
            />
          </div>
        </div>
      </section>

      {/* 4.5 제품 미리보기 (Preview) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 break-keep">실제로 이렇게 동작합니다</h2>
          <p className="text-slate-400 text-sm sm:text-base break-keep">배차부터 창고 재고까지, 한 화면에서 관리하는 실제 운영 콘솔입니다.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl shadow-black/40">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-3 text-[11px] text-slate-500 font-mono">app.dot2line.co.kr</span>
          </div>
          <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-600">
            <BarChart3 size={40} className="text-slate-700" />
            <p className="text-xs sm:text-sm text-slate-500">실제 운영 화면 스크린샷 예정</p>
          </div>
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

      {/* 5.5 자주 묻는 질문 (FAQ) */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-10 text-center break-keep">자주 묻는 질문</h2>
        <div className="flex flex-col gap-4">
          <FaqItem
            q="지금 어떤 업무까지 지원하나요?"
            a="주문/기준정보 관리, 배차·배송 계획, 창고 입출고 및 재고 관리(WMS)까지 실제 운영 중인 기능입니다. 계속 기능이 추가되고 있습니다."
          />
          <FaqItem
            q="도입까지 얼마나 걸리나요?"
            a="별도 설치 없이 가입 즉시 웹에서 바로 사용할 수 있습니다. 초기 셋팅은 기존에 쓰시던 엑셀 기준정보를 그대로 업로드하는 방식으로 지원해 빠르게 시작하실 수 있습니다."
          />
          <FaqItem
            q="기존에 쓰던 시스템과 연동할 수 있나요?"
            a="API 연동을 지원합니다. 기존 ERP·주문 시스템과 데이터를 주고받아 이중 입력 없이 연결할 수 있습니다."
          />
          <FaqItem
            q="우리 회사 데이터는 안전한가요?"
            a="회사(조직)별로 데이터가 분리되어 저장되어 다른 조직에서는 조회할 수 없고, 개인정보는 암호화된 상태로 저장됩니다."
          />
          <FaqItem
            q="더 자세히 상담받고 싶어요."
            a="가입 후 도입 문의를 남겨주시면 담당자가 확인 후 연락드립니다."
          />
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

function SecurityItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm sm:text-base font-bold text-slate-100 break-keep">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed break-keep">{desc}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl open:border-indigo-500/40 transition">
      <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-sm sm:text-base text-slate-100 break-keep">
        {q}
        <span className="ml-4 shrink-0 text-slate-500 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
      </summary>
      <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed break-keep">{a}</p>
    </details>
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