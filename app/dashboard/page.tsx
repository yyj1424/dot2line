'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Box, Truck, BarChart3, Users, LogOut, ShieldCheck, 
  Building, Copy, Check, ExternalLink
} from 'lucide-react';

interface UserOrgInfo {
  userName: string;
  orgName: string;
  orgCode: string;
  role: string;
}

type TabType = 'MDM' | 'WMS' | 'TMS' | 'SETTLEMENT';

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [orgInfo, setOrgInfo] = useState<UserOrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('MDM');
  
  const router = useRouter();
  const supabase = createClient();

  // ★ 메인 관리시스템(Spring SSO) 이동 함수 복원
  const handleOpenSpringService = async (servicePath: string = '/index2') => {
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
        <p className="text-sm font-medium animate-pulse">물류 세션 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* ================= PC 전용 사이드바 ================= */}
      <aside className="w-64 bg-slate-900/70 border-r border-slate-800/80 p-5 flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            DOT2LINE Logistics
          </div>

          <div className="mb-6 p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Building size={14} className="text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">소속</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                {orgInfo?.role}
              </span>
            </div>

            <h3 className="text-base font-bold text-white truncate my-1">
              {orgInfo?.orgName}
            </h3>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
              <span className="text-[11px] font-mono text-slate-400">
                코드: <strong className="text-indigo-200">{orgInfo?.orgCode}</strong>
              </span>

              {!orgInfo?.orgCode.startsWith('PERSONAL_') && (
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>
              )}
            </div>
          </div>

          <nav className="space-y-1">
            <SidebarTabBtn 
              icon={<Users size={18} />} 
              text="통합 기준정보 (MDM)" 
              active={activeTab === 'MDM'} 
              onClick={() => setActiveTab('MDM')} 
            />
            <SidebarTabBtn 
              icon={<Box size={18} />} 
              text="창고 관리 (WMS)" 
              active={activeTab === 'WMS'} 
              onClick={() => setActiveTab('WMS')} 
            />
            <SidebarTabBtn 
              icon={<Truck size={18} />} 
              text="수배송 관리 (TMS)" 
              active={activeTab === 'TMS'} 
              onClick={() => setActiveTab('TMS')} 
            />
            <SidebarTabBtn 
              icon={<BarChart3 size={18} />} 
              text="통합 정산 시스템" 
              active={activeTab === 'SETTLEMENT'} 
              onClick={() => setActiveTab('SETTLEMENT')} 
            />
          </nav>
        </div>

        <div className="space-y-3">
          {/* PC 사이드바 하단 메인 관리시스템 가기 버튼 */}
          <button
            onClick={() => handleOpenSpringService('/index2')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <span>메인 시스템 접속</span>
            <ExternalLink size={13} />
          </button>

          <div className="border-t border-slate-800 pt-3">
            <p className="text-[11px] text-slate-500 mb-0.5">접속 계정</p>
            <p className="text-xs font-medium text-slate-300 truncate mb-2">{userEmail}</p>
            <button
              onClick={handleLogout}
              className="w-full py-2 bg-slate-800/80 hover:bg-red-950/40 hover:text-red-400 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <LogOut size={13} /> 로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* ================= 메인 화면 ================= */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl">
        {/* 모바일 상단 유저 카드 */}
        <div className="md:hidden mb-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <Building size={14} className="text-indigo-400" />
              <span className="text-xs font-bold text-white">{orgInfo?.orgName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1"
            >
              <LogOut size={12} />
              <span>로그아웃</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>코드: <strong className="text-indigo-300 font-mono">{orgInfo?.orgCode}</strong></span>
            <span className="truncate max-w-[160px]">{userEmail}</span>
          </div>
        </div>

        {/* 모바일 전용 2x2 그리드 메뉴 탭 */}
        <div className="grid grid-cols-2 gap-2 md:hidden mb-4">
          <MobileTabButton
            active={activeTab === 'MDM'}
            label="기준정보 (MDM)"
            icon={<Users size={15} />}
            onClick={() => setActiveTab('MDM')}
          />
          <MobileTabButton
            active={activeTab === 'WMS'}
            label="창고 관리 (WMS)"
            icon={<Box size={15} />}
            onClick={() => setActiveTab('WMS')}
          />
          <MobileTabButton
            active={activeTab === 'TMS'}
            label="수배송 (TMS)"
            icon={<Truck size={15} />}
            onClick={() => setActiveTab('TMS')}
          />
          <MobileTabButton
            active={activeTab === 'SETTLEMENT'}
            label="통합 정산"
            icon={<BarChart3 size={15} />}
            onClick={() => setActiveTab('SETTLEMENT')}
          />
        </div>

        {/* 상단 타이틀 및 메인 시스템 바로가기 버튼 헤더 */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-white">
              {activeTab === 'MDM' && '기준정보 관리 현황 (MDM)'}
              {activeTab === 'WMS' && '창고 및 재고 운영 현황 (WMS)'}
              {activeTab === 'TMS' && '수배송 및 배차 관제 (TMS)'}
              {activeTab === 'SETTLEMENT' && '통합 정산 및 마감 현황'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              실시간으로 연동된 물류 운영 지표를 확인합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <ShieldCheck size={14} />
              <span>실시간 동기화됨</span>
            </div>

            {/* ★ 모바일/PC 공용 메인 관리시스템 가기 버튼 */}
            <button
              onClick={() => handleOpenSpringService('/index2')}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-indigo-600/20 active:scale-95 shrink-0"
            >
              <span>메인 시스템 접속</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </header>

        {/* ================= 탭별 현황 화면 ================= */}
        {activeTab === 'MDM' && <MdmView />}
        {activeTab === 'WMS' && <WmsView />}
        {activeTab === 'TMS' && <TmsView />}
        {activeTab === 'SETTLEMENT' && <SettlementView />}
      </main>
    </div>
  );
}

/* ================== PC 사이드바 버튼 ================== */
function SidebarTabBtn({ icon, text, active, onClick }: { icon: React.ReactNode; text: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
        active ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

/* ================== 모바일 2x2 탭 버튼 ================== */
function MobileTabButton({ 
  label, 
  icon, 
  active, 
  onClick 
}: { 
  label: string; 
  icon: React.ReactNode; 
  active: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition active:scale-95 ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
          : 'bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-200'
      }`}
    >
      <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

/* ================== 1. 기준정보 (MDM) 현황 ================== */
function MdmView() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="등록 거래처" value="142 개사" sub="매출처 89 / 매입처 53" color="indigo" />
        <SummaryCard title="물류 거점 센터" value="8 개소" sub="수도권 5 / 영남 3" color="sky" />
        <SummaryCard title="등록 수송 차량" value="64 대" sub="지입 42 / 직영 22" color="emerald" />
        <SummaryCard title="품목 마스터(SKU)" value="3,210 종" sub="금주 신규 +14" color="purple" />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">최근 등록된 기준정보 목록</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 pb-2">
              <tr>
                <th className="py-2 font-medium">구분</th>
                <th className="py-2 font-medium">코드 / 명칭</th>
                <th className="py-2 font-medium hidden sm:table-cell">관리센터</th>
                <th className="py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px]">거래처</span></td>
                <td className="py-2.5 font-medium text-white">CLNT-092 (주)대한유통</td>
                <td className="py-2.5 text-slate-400 hidden sm:table-cell">이천 메인센터</td>
                <td className="py-2.5 text-emerald-400">정상 사용</td>
              </tr>
              <tr>
                <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">차량</span></td>
                <td className="py-2.5 font-medium text-white">경기 85바 1234 (11t 윙바디)</td>
                <td className="py-2.5 text-slate-400 hidden sm:table-cell">평택 저온센터</td>
                <td className="py-2.5 text-emerald-400">배차 가능</td>
              </tr>
              <tr>
                <td className="py-2.5"><span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px]">센터</span></td>
                <td className="py-2.5 font-medium text-white">CTR-008 용인 물류센터</td>
                <td className="py-2.5 text-slate-400 hidden sm:table-cell">용인센터</td>
                <td className="py-2.5 text-amber-400">오픈 준비중</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================== 2. 창고 관리 (WMS) 현황 ================== */
function WmsView() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="현재 창고 보관율" value="84.2 %" sub="총 12,000 PLT 중 10,104 PLT" color="indigo" />
        <SummaryCard title="금일 입고 (예정/완료)" value="18 / 12 건" sub="입고율 66.7%" color="emerald" />
        <SummaryCard title="금일 출고 (예정/완료)" value="45 / 38 건" sub="출고율 84.4%" color="amber" />
        <SummaryCard title="재고 불일치/이상" value="0 건" sub="정상 보관 중" color="sky" />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">거점 센터별 보관 및 입출고</h3>
        <div className="space-y-3">
          <WarehouseProgress center="이천 제1 메인센터" rate={88} inbound={8} outbound={20} />
          <WarehouseProgress center="평택 저온 물류센터" rate={92} inbound={4} outbound={12} />
          <WarehouseProgress center="칠곡 영남 물류센터" rate={65} inbound={6} outbound={6} />
        </div>
      </div>
    </div>
  );
}

/* ================== 3. 수배송 관리 (TMS) 현황 ================== */
function TmsView() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="금일 배차 완료율" value="98.5 %" sub="65건 중 64건 배차" color="emerald" />
        <SummaryCard title="운행 중 차량" value="28 대" sub="GPS 관제 연결" color="sky" />
        <SummaryCard title="배송 완료 보고" value="34 건" sub="진행률 53%" color="indigo" />
        <SummaryCard title="지연 징후 차량" value="1 건" sub="정체 구간 감지" color="amber" />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">실시간 배차 및 운행 관제</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 pb-2">
              <tr>
                <th className="py-2 font-medium">배차번호</th>
                <th className="py-2 font-medium">차량 / 기사</th>
                <th className="py-2 font-medium">구간 (출발 ➔ 도착)</th>
                <th className="py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 font-mono text-indigo-300">TMS-2608-0041</td>
                <td className="py-2.5 font-medium text-white">서울 80아 5678 (이운송)</td>
                <td className="py-2.5 text-slate-300">이천센터 ➔ 강남 물류거점</td>
                <td className="py-2.5 text-sky-400">운행 중 (도착 15:40)</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono text-indigo-300">TMS-2608-0042</td>
                <td className="py-2.5 font-medium text-white">경기 91바 9988 (박기사)</td>
                <td className="py-2.5 text-slate-300">평택센터 ➔ 대전 물류허브</td>
                <td className="py-2.5 text-emerald-400">배송 완료 (14:15)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================== 4. 통합 정산 현황 ================== */
function SettlementView() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="당월 매출 집계" value="₩ 148.5 M" sub="전월 대비 +12%" color="indigo" />
        <SummaryCard title="당월 운송 매입" value="₩ 92.4 M" sub="지입/용차 운임 합산" color="purple" />
        <SummaryCard title="마감 완료율" value="82 %" sub="142개사 중 116개 확정" color="emerald" />
        <SummaryCard title="검증요청 건" value="3 건" sub="차액 확인 필요" color="amber" />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">최근 정산 마감 및 세금계산서 발행</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 pb-2">
              <tr>
                <th className="py-2 font-medium">정산 기간</th>
                <th className="py-2 font-medium">거래처 / 대상</th>
                <th className="py-2 font-medium">금액</th>
                <th className="py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 font-mono text-slate-400">2026-08 (1차)</td>
                <td className="py-2.5 font-medium text-white">(주)동아물류 (매출)</td>
                <td className="py-2.5 font-mono text-emerald-400">₩ 24,500,000</td>
                <td className="py-2.5 text-emerald-400">발행 완료</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono text-slate-400">2026-08 (1차)</td>
                <td className="py-2.5 font-medium text-white">경인로지스 협동조합 (매입)</td>
                <td className="py-2.5 font-mono text-slate-300">₩ 18,200,000</td>
                <td className="py-2.5 text-amber-400">검증 대기</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================== 공통 서브 컴포넌트 ================== */
function SummaryCard({ title, value, sub, color }: { title: string; value: string; sub: string; color: 'indigo' | 'sky' | 'emerald' | 'purple' | 'amber' }) {
  const borderColors = {
    indigo: 'border-indigo-500/20',
    sky: 'border-sky-500/20',
    emerald: 'border-emerald-500/20',
    purple: 'border-purple-500/20',
    amber: 'border-amber-500/20',
  };

  return (
    <div className={`p-3.5 sm:p-4 bg-slate-900/60 border ${borderColors[color]} rounded-xl`}>
      <p className="text-[11px] font-medium text-slate-400 mb-1">{title}</p>
      <p className="text-base sm:text-xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-[10px] sm:text-xs text-slate-400 truncate">{sub}</p>
    </div>
  );
}

function WarehouseProgress({ center, rate, inbound, outbound }: { center: string; rate: number; inbound: number; outbound: number }) {
  return (
    <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="font-semibold text-slate-200">{center}</span>
        <span className="text-indigo-400 font-mono font-bold">보관율 {rate}%</span>
      </div>
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
        <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${rate}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>입고 대기/처리: <strong className="text-emerald-400">{inbound}건</strong></span>
        <span>출고 대기/처리: <strong className="text-amber-400">{outbound}건</strong></span>
      </div>
    </div>
  );
}