'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Box, Truck, BarChart3, Users, LogOut, ShieldCheck, 
  Building, Copy, Check, ExternalLink
} from 'lucide-react';

/** 4개 탭 공통 — 브라우저의 Supabase access token을 같은 오리진의 프록시 라우트로 넘겨서
 * (해당 라우트가 서버사이드에서 transys2를 대신 호출) 조직 스코핑된 대시보드 데이터를 가져온다. */
function useDashboardSummary<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (!cancelled) { setError('세션이 만료되었습니다. 다시 로그인해 주세요.'); setLoading(false); } return; }
      try {
        const res = await fetch(`/api/${endpoint}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(body.message || '데이터를 불러오지 못했습니다.'); setLoading(false); return; }
        setData(body);
      } catch {
        if (!cancelled) setError('데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return { data, loading, error };
}

interface UserOrgInfo {
  userName: string;
  orgName: string;
  orgCode: string;
  role: string;
  clientMasterCd?: string | null;
  clientMasterNm?: string | null;
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
  const handleOpenSpringService = async (servicePath: string = '/') => {
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
    const currentClientMasterCd = orgInfo?.clientMasterCd || '';

    let targetUrl = `${springApiUrl}/sso/login?token=${encodeURIComponent(accessToken)}&userName=${encodeURIComponent(currentUserName)}&orgName=${encodeURIComponent(currentOrgName)}&orgCode=${encodeURIComponent(currentOrgCode)}&role=${encodeURIComponent(currentRole)}&redirect=${encodeURIComponent(servicePath)}`;
    if (currentClientMasterCd) {
      targetUrl += `&clientMasterCd=${encodeURIComponent(currentClientMasterCd)}`;
    }

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
          client_master_cd,
          client_master_nm,
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
          clientMasterCd: profile.client_master_cd || null,
          clientMasterNm: profile.client_master_nm || null,
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

  // 화주사 담당자(client)는 이 4개 탭이 전부 조직 전체(다른 화주사 포함) 운영/매출 데이터라 볼 수
  // 없다 — 서버(transys2 대시보드 API)도 동일하게 403으로 막지만, 화면 자체를 아예 다르게 보여준다.
  if (orgInfo?.role === 'client') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <Building size={28} className="mx-auto text-indigo-400" />
          <h1 className="text-lg font-bold text-white">{orgInfo.orgName}</h1>
          <p className="text-sm text-slate-400">
            화주사 담당자 계정은 조직 전체 운영 현황 대시보드를 볼 수 없습니다.<br />
            주문 조회·등록은 메인 시스템에서 이용해 주세요.
          </p>
          <button
            onClick={() => handleOpenSpringService('/')}
            className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/20"
          >
            <span>메인 시스템 접속</span>
            <ExternalLink size={14} />
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-800/80 hover:bg-red-950/40 hover:text-red-400 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} /> 로그아웃
          </button>
        </div>
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
            {orgInfo?.role !== 'client' && (
              <SidebarTabBtn
                icon={<BarChart3 size={18} />}
                text="통합 정산 시스템"
                active={activeTab === 'SETTLEMENT'}
                onClick={() => setActiveTab('SETTLEMENT')}
              />
            )}
          </nav>
        </div>

        <div className="space-y-3">
          {/* PC 사이드바 하단 메인 관리시스템 가기 버튼 */}
          <button
            onClick={() => handleOpenSpringService('/')}
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
          {orgInfo?.role !== 'client' && (
            <MobileTabButton
              active={activeTab === 'SETTLEMENT'}
              label="통합 정산"
              icon={<BarChart3 size={15} />}
              onClick={() => setActiveTab('SETTLEMENT')}
            />
          )}
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
              onClick={() => handleOpenSpringService('/')}
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
interface MdmRecentRow { kind: string; label: string; sub: string; status: string }
interface MdmSummary {
  clientTotal: number; clientShipperCount: number; clientVendorCount: number;
  centerTotal: number; centerMainCount: number; centerSubCount: number; centerPointCount: number;
  carTotal: number; carDeliveryCount: number; carTransportCount: number;
  productCount: number; productNewThisWeekCount: number;
  recentList: MdmRecentRow[];
}
const MDM_KIND_BADGE: Record<string, string> = {
  '거래처': 'bg-blue-500/10 text-blue-400', '차량': 'bg-emerald-500/10 text-emerald-400', '센터': 'bg-purple-500/10 text-purple-400',
};

function MdmView() {
  const { data, loading, error } = useDashboardSummary<MdmSummary>('mdm-summary');
  if (loading) return <ViewLoading label="기준정보 데이터 불러오는 중..." />;
  if (error || !data) return <ViewError message={error} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="등록 거래처" value={`${data.clientTotal} 개사`} sub={`화주사 ${data.clientShipperCount} / 매입처 ${data.clientVendorCount}`} color="indigo" />
        <SummaryCard title="물류 거점 센터" value={`${data.centerTotal} 개소`} sub={`메인 ${data.centerMainCount} / 서브 ${data.centerSubCount} / 착지 ${data.centerPointCount}`} color="sky" />
        <SummaryCard title="등록 차량" value={`${data.carTotal} 대`} sub={`배송용 ${data.carDeliveryCount} / 수송용 ${data.carTransportCount}`} color="emerald" />
        <SummaryCard title="품목 마스터(SKU)" value={`${data.productCount} 종`} sub={`금주 신규 +${data.productNewThisWeekCount}`} color="purple" />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">최근 등록된 기준정보 목록</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 pb-2">
              <tr>
                <th className="py-2 font-medium">구분</th>
                <th className="py-2 font-medium">코드 / 명칭</th>
                <th className="py-2 font-medium hidden sm:table-cell">비고</th>
                <th className="py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data.recentList.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">등록된 기준정보가 없습니다.</td></tr>
              )}
              {data.recentList.map((row, i) => (
                <tr key={i}>
                  <td className="py-2.5"><span className={`px-1.5 py-0.5 rounded text-[10px] ${MDM_KIND_BADGE[row.kind] || 'bg-slate-700/40 text-slate-300'}`}>{row.kind}</span></td>
                  <td className="py-2.5 font-medium text-white">{row.label}</td>
                  <td className="py-2.5 text-slate-400 hidden sm:table-cell">{row.sub}</td>
                  <td className={`py-2.5 ${row.status.includes('삭제') ? 'text-red-400' : row.status.includes('미사용') ? 'text-amber-400' : 'text-emerald-400'}`}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================== 2. 창고 관리 (WMS) 현황 ================== */
interface WmsCenterRow { centerCd: string; centerNm: string; usableCount: number; usedCount: number; inboundCount: number; outboundCount: number; rate: number }
interface WmsSummary {
  storageRate: number; usableLocationCount: number; usedLocationCount: number;
  todayInboundTotal: number; todayInboundDone: number;
  todayOutboundTotal: number; todayOutboundDone: number;
  stockAnomalyCount: number;
  centers: WmsCenterRow[];
}

function WmsView() {
  const { data, loading, error } = useDashboardSummary<WmsSummary>('wms-summary');
  if (loading) return <ViewLoading label="창고 데이터 불러오는 중..." />;
  if (error || !data) return <ViewError message={error} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="로케이션 사용률" value={`${data.storageRate} %`} sub={`총 ${data.usableLocationCount}개 중 ${data.usedLocationCount}개 사용중`} color="indigo" />
        <SummaryCard title="금일 입고 (완료/전체)" value={`${data.todayInboundDone} / ${data.todayInboundTotal} 건`} sub="입고예정 기준" color="emerald" />
        <SummaryCard title="금일 출고 (완료/전체)" value={`${data.todayOutboundDone} / ${data.todayOutboundTotal} 건`} sub="출고예정 기준" color="amber" />
        <SummaryCard title="재고 이상" value={`${data.stockAnomalyCount} 건`} sub={data.stockAnomalyCount === 0 ? '정상 보관 중' : '가용재고 음수 발생'} color="sky" />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">거점 센터별 보관 및 입출고</h3>
        <div className="space-y-3">
          {data.centers.length === 0 && <p className="text-xs text-slate-500 py-4 text-center">WMS를 사용하는 센터가 없습니다.</p>}
          {data.centers.map((c) => (
            <WarehouseProgress key={c.centerCd} center={c.centerNm} rate={c.rate} inbound={c.inboundCount} outbound={c.outboundCount} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================== 3. 수배송 관리 (TMS) 현황 ================== */
interface TmsDispatchRow {
  seq: number; orderDt: string; carNo: string; driverNm: string; fromCenterNm: string; toCenterNm: string;
  confirmYn: string; saleConfirmYn: string; buyConfirmYn: string;
}
interface TmsSummary {
  todayDispatchCount: number; monthDispatchCount: number;
  totalCarCount: number; activeCarCount: number; activeCarRate: number;
  recentDispatches: TmsDispatchRow[];
}

function dispatchStatusLabel(row: TmsDispatchRow): { text: string; className: string } {
  if (row.confirmYn === 'Y') return { text: '정산 확정', className: 'text-emerald-400' };
  if (row.saleConfirmYn === 'Y' || row.buyConfirmYn === 'Y') return { text: '부분 확정', className: 'text-sky-400' };
  return { text: '확정 대기', className: 'text-amber-400' };
}

function TmsView() {
  const { data, loading, error } = useDashboardSummary<TmsSummary>('tms-summary');
  if (loading) return <ViewLoading label="배차 데이터 불러오는 중..." />;
  if (error || !data) return <ViewError message={error} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="금일 배차 등록" value={`${data.todayDispatchCount} 건`} sub="오늘 등록된 배차" color="emerald" />
        <SummaryCard title="이번달 누적 배차" value={`${data.monthDispatchCount} 건`} sub="이번 달 전체" color="indigo" />
        <SummaryCard title="차량 가동률" value={`${data.activeCarRate} %`} sub={`등록 ${data.totalCarCount}대 중 ${data.activeCarCount}대 가동`} color="sky" />
        <SummaryCard title="미가동 차량" value={`${Math.max(data.totalCarCount - data.activeCarCount, 0)} 대`} sub="이번 달 배차 이력 없음" color="amber" />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">최근 배차 현황</h3>
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
              {data.recentDispatches.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">최근 배차 내역이 없습니다.</td></tr>
              )}
              {data.recentDispatches.map((row) => {
                const s = dispatchStatusLabel(row);
                return (
                  <tr key={row.seq}>
                    <td className="py-2.5 font-mono text-indigo-300">DS-{row.seq}</td>
                    <td className="py-2.5 font-medium text-white">{row.carNo} {row.driverNm ? `(${row.driverNm})` : ''}</td>
                    <td className="py-2.5 text-slate-300">{row.fromCenterNm} ➔ {row.toCenterNm}</td>
                    <td className={`py-2.5 ${s.className}`}>{s.text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ViewLoading({ label }: { label: string }) {
  return <div className="text-sm text-slate-400 py-10 text-center">{label}</div>;
}
function ViewError({ message }: { message?: string | null }) {
  return <div className="text-sm text-red-400 py-10 text-center">{message || '데이터를 불러오지 못했습니다.'}</div>;
}

/* ================== 4. 통합 정산 현황 ================== */
interface SettlementLedgerRow {
  type: 'BILLING' | 'PAYOUT';
  no: string;
  periodFrom: string;
  periodTo: string;
  targetName: string;
  amount: number;
  status: string;
}

interface SettlementSummary {
  monthlyBillingTotal: number;
  monthlyPayoutTotal: number;
  closingRate: number;
  closingConfirmedCount: number;
  closingTotalCount: number;
  pendingCount: number;
  recentSettlements: SettlementLedgerRow[];
}

const SETTLEMENT_STATUS_NM: Record<string, string> = {
  DRAFT: '작성중', CONFIRMED: '확정', SENT: '발송완료', PAID: '지급완료', CANCELLED: '취소',
};

function formatWon(n: number) {
  return '₩ ' + Math.round(n).toLocaleString();
}

function periodLabel(from: string, to: string) {
  const f = (from || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  const t = (to || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  return from === to ? f : `${f} ~ ${t}`;
}

function SettlementView() {
  const { data: summary, loading, error } = useDashboardSummary<SettlementSummary>('settlement-summary');

  if (loading) return <ViewLoading label="정산 데이터 불러오는 중..." />;
  if (error || !summary) return <ViewError message={error} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="당월 매출 집계" value={formatWon(summary.monthlyBillingTotal)} sub="청구 원장 합계(취소 제외)" color="indigo" />
        <SummaryCard title="당월 운송 매입" value={formatWon(summary.monthlyPayoutTotal)} sub="수송 매입처 지급 원장 합계" color="purple" />
        <SummaryCard title="마감 완료율" value={`${summary.closingRate} %`} sub={`이번 달 대상 ${summary.closingTotalCount}건 중 ${summary.closingConfirmedCount}건 확정`} color="emerald" />
        <SummaryCard title="미청구/미정산 대기" value={`${summary.pendingCount} 건`} sub="아직 청구서·정산서로 안 묶인 원장" color="amber" />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">최근 청구서 · 지급 정산서</h3>
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
              {summary.recentSettlements.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">최근 청구서/정산서 내역이 없습니다.</td></tr>
              )}
              {summary.recentSettlements.map((row) => (
                <tr key={row.type + row.no}>
                  <td className="py-2.5 font-mono text-slate-400">{periodLabel(row.periodFrom, row.periodTo)}</td>
                  <td className="py-2.5 font-medium text-white">{row.targetName} ({row.type === 'BILLING' ? '매출' : '매입'})</td>
                  <td className={`py-2.5 font-mono ${row.type === 'BILLING' ? 'text-emerald-400' : 'text-slate-300'}`}>{formatWon(row.amount)}</td>
                  <td className={`py-2.5 ${row.status === 'CANCELLED' ? 'text-red-400' : row.status === 'DRAFT' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {SETTLEMENT_STATUS_NM[row.status] || row.status}
                  </td>
                </tr>
              ))}
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