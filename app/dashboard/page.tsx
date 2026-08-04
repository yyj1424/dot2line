'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Box, Truck, BarChart3, Users, LogOut, ShieldCheck, Building, Copy, Check, ExternalLink } from 'lucide-react';

interface UserOrgInfo {
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

  // ★ 수정된 이벤트 핸들러: orgCode 파라미터 추가 전달
  const handleOpenSpringService = async (servicePath: string) => {
    // 1. 현재 Supabase 세션에서 JWT Access Token을 가져옵니다.
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
      router.push('/login');
      return;
    }

    const accessToken = session.access_token;
    const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

    const currentOrgCode = orgInfo?.orgCode || '';
    const currentRole = orgInfo?.role || 'member'; // ★ role 추가 (owner, admin, user 등)

    // targetUrl에 role 파라미터 추가
    const targetUrl = `${springApiUrl}/sso/login?token=${encodeURIComponent(accessToken)}&orgCode=${encodeURIComponent(currentOrgCode)}&role=${encodeURIComponent(currentRole)}&redirect=${encodeURIComponent(servicePath)}`;

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

      // 프로필 및 조직 정보 조회 (명시적 FK 조인)
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
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

      if (profile && orgData && orgData.org_code) {
        setOrgInfo({
          orgName: orgData.org_name,
          orgCode: orgData.org_code,
          role: profile.role || 'user',
        });
      } else {
        const emailPrefix = user.email ? user.email.split('@')[0].toUpperCase() : 'USER';
        setOrgInfo({
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-72 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between hidden md:flex">
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

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">종합 관제 대시보드</h1>
            <p className="text-sm text-slate-400">
              현재 <span className="text-indigo-400 font-semibold">[{orgInfo?.orgName}]</span> 스코프에서 구동 중입니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-full text-indigo-400 text-sm">
              <ShieldCheck size={16} /> 보안 세션 연결됨
            </div>

            <button
              onClick={() => handleOpenSpringService('/index2')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-full text-sm transition shadow-lg shadow-indigo-600/20"
            >
              <span>관리시스템</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </header>
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