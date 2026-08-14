'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Box, Truck, BarChart3, Users, LogOut, ShieldCheck, 
  Building, Copy, Check, ExternalLink, LayoutDashboard, ChevronRight 
} from 'lucide-react';

interface UserOrgInfo {
  userName: string;
  orgName: string;
  orgCode: string;
  role: string;
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [orgInfo, setOrgInfo] = useState<UserOrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleOpenSpringService = async (servicePath: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
      router.push('/login');
      return;
    }

    const accessToken = session.access_token;
    const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

    const currentUserName = orgInfo?.userName || '';
    const currentOrgCode = orgInfo?.orgCode || '';
    const currentOrgName = orgInfo?.orgName || '';
    const currentRole = orgInfo?.role || 'member';

    const targetUrl = `${springApiUrl}/sso/login?token=${encodeURIComponent(accessToken)}&userName=${encodeURIComponent(currentUserName)}&orgName=${encodeURIComponent(currentOrgName)}&orgCode=${encodeURIComponent(currentOrgCode)}&role=${encodeURIComponent(currentRole)}&redirect=${encodeURIComponent(servicePath)}`;

    window.open(targetUrl, '_blank');
  };

  useEffect(() => {
    const checkUserAndOrg = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          user_name,
          role,
          organizations:org_id (
            org_name,
            org_code
          )
        `)
        .eq('id', user.id)
        .single();

      const rawOrg = profile?.organizations;
      const orgData = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg;
      const fallbackName = user.email ? user.email.split('@')[0] : '사용자';

      if (profile && orgData && orgData.org_code) {
        setOrgInfo({
          userName: profile.user_name || fallbackName,
          orgName: orgData.org_name,
          orgCode: orgData.org_code,
          role: profile.role || 'user',
        });
      } else {
        const emailPrefix = user.email ? user.email.split('@')[0].toUpperCase() : 'USER';
        setOrgInfo({
          userName: profile?.user_name || fallbackName,
          orgName: '개인 워크스페이스',
          orgCode: `PERSONAL_${emailPrefix}`,
          role: profile?.role || 'individual',
        });
      }

      setLoading(false);
    };

    checkUserAndOrg();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCopyCode = () => {
    if (!orgInfo?.orgCode || orgInfo.orgCode.startsWith('PERSONAL_')) return;
    navigator.clipboard.writeText(orgInfo.orgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p className="text-lg font-medium">물류 시스템 세션 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* ================= PC 전용 사이드바 ================= */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 p-5 flex-col justify-between hidden md:flex">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            DOT2LINE Logistics SCM
          </div>

          <div className="mb-6 p-3.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Building size={16} className="text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-300">소속 그룹</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                {orgInfo?.role}
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-white truncate my-1">
              {orgInfo?.orgName}
            </h3>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-900/50">
              <span className="text-xs font-mono text-slate-400">
                CODE: <strong className="text-indigo-200">{orgInfo?.orgCode}</strong>
              </span>

              {!orgInfo?.orgCode.startsWith('PERSONAL_') && (
                <button
                  onClick={handleCopyCode}
                  title="그룹코드 복사"
                  className="p-1 hover:bg-indigo-900/60 rounded text-indigo-300 transition flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>
              )}
            </div>
          </div>

          <nav className="space-y-1.5">
            <SidebarLink 
              icon={<Users size={18} />} 
              text="통합 기준정보 (MDM)" 
              onClick={() => handleOpenSpringService('/mdm/main')}
            />
            <SidebarLink 
              icon={<Box size={18} />} 
              text="창고 관리 (WMS)" 
              onClick={() => handleOpenSpringService('/wms/main')}
            />
            <SidebarLink 
              icon={<Truck size={18} />} 
              text="수배송 관리 (TMS)" 
              onClick={() => handleOpenSpringService('/tms/main')}
            />
            <SidebarLink 
              icon={<BarChart3 size={18} />} 
              text="통합 정산 시스템" 
              onClick={() => handleOpenSpringService('/settlement/main')}
            />
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-500 mb-1">로그인 계정</p>
          <p className="text-sm font-medium text-slate-300 truncate mb-3">{userEmail}</p>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-800 hover:bg-red-900/40 hover:text-red-400 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      </aside>

      {/* ================= 메인 본문 (모바일 & PC 공용) ================= */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* 모바일 최상단 유저/소속 상태 카드 */}
        <div className="md:hidden mb-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Building size={16} className="text-indigo-400" />
              <span className="text-xs font-bold text-slate-400">DOT2LINE SCM</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 uppercase">
              {orgInfo?.role}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-white mb-1">
            {orgInfo?.orgName}
          </h2>
          <p className="text-xs text-slate-400 truncate mb-3">{userEmail}</p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <span className="font-mono text-slate-400">
              코드: <strong className="text-indigo-300">{orgInfo?.orgCode}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition"
            >
              <LogOut size={13} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>

        {/* 상단 대시보드 헤더 */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">종합 관제 대시보드</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              현재 <span className="text-indigo-400 font-semibold">[{orgInfo?.orgName}]</span> 스코프에서 구동 중입니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 px-3 py-2 rounded-xl text-indigo-400 text-xs md:text-sm">
              <ShieldCheck size={15} />
              <span>보안 세션 연결됨</span>
            </div>

            <button
              onClick={() => handleOpenSpringService('/index2')}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-xs md:text-sm transition shadow-lg shadow-indigo-600/20"
            >
              <span>관리시스템</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </header>

        {/* ★ [모바일 전용] 어플리케이션 앱 아이콘 그리드 레이아웃 */}
        <section className="md:hidden mb-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
            <LayoutDashboard size={14} className="text-indigo-400" />
            <span>주요 업무 메뉴</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <MobileMenuTile
              title="기준정보 (MDM)"
              desc="통합 코드 및 기준 관리"
              icon={<Users className="text-sky-400" size={26} />}
              bgClass="bg-sky-950/40 border-sky-500/30 hover:border-sky-400"
              onClick={() => handleOpenSpringService('/mdm/main')}
            />
            <MobileMenuTile
              title="창고 관리 (WMS)"
              desc="재고 입출고 및 세이프티"
              icon={<Box className="text-indigo-400" size={26} />}
              bgClass="bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-400"
              onClick={() => handleOpenSpringService('/wms/main')}
            />
            <MobileMenuTile
              title="수배송 (TMS)"
              desc="차량 배차 및 물류 관제"
              icon={<Truck className="text-emerald-400" size={26} />}
              bgClass="bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400"
              onClick={() => handleOpenSpringService('/tms/main')}
            />
            <MobileMenuTile
              title="통합 정산"
              desc="매출/매입 및 마감 관리"
              icon={<BarChart3 className="text-amber-400" size={26} />}
              bgClass="bg-amber-950/40 border-amber-500/30 hover:border-amber-400"
              onClick={() => handleOpenSpringService('/settlement/main')}
            />
          </div>
        </section>

        {/* PC 화면 전용 안내 카드 (필요시 사용) */}
        <div className="hidden md:block p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-2">물류 관제 모니터링 준비 완료</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            좌측 사이드바 또는 상단 관리시스템 버튼을 클릭하여 원하시는 SCM 모듈로 빠르게 이동할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ icon, text, active = false, onClick }: { icon: React.ReactNode; text: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
      onClick={onClick}
    >
      {icon}
      {text}
    </button>
  );
}

{/* ★ 모바일 앱 전용 아이콘 타일 컴포넌트 */}
function MobileMenuTile({ title, desc, icon, bgClass, onClick }: { title: string; desc: string; icon: React.ReactNode; bgClass: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col justify-between p-4 rounded-2xl border transition text-left h-36 active:scale-95 ${bgClass}`}
    >
      <div className="flex justify-between items-start w-full">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          {icon}
        </div>
        <ChevronRight size={16} className="text-slate-500 mt-1" />
      </div>

      <div>
        <h3 className="font-bold text-sm text-white">{title}</h3>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">{desc}</p>
      </div>
    </button>
  );
}