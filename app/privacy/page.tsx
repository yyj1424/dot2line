import Link from 'next/link';

export const metadata = {
  title: '개인정보처리방침 | DOT2LINE',
};

function TodoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[13px] font-medium align-middle">
      {children}
    </span>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <Link href="/" className="text-sm text-indigo-400 hover:underline">
          ← 홈으로
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mt-6 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-slate-500 mb-10">
          시행일: <TodoBadge>YYYY-MM-DD 입력 필요</TodoBadge>
        </p>

        <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200 leading-relaxed">
          이 문서는 표준 개인정보처리방침 양식을 바탕으로 작성된 초안입니다.{' '}
          <TodoBadge>노란색으로 표시된 항목</TodoBadge>은 실제 사업자 정보로 반드시 교체해야 하며,
          정식 서비스 오픈 전 법률 검토를 받는 것을 권장합니다.
        </div>

        <div className="space-y-10 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-50 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-300 [&_th]:border-b [&_th]:border-slate-800 [&_th]:py-2 [&_td]:border-b [&_td]:border-slate-900 [&_td]:py-2 [&_td]:text-slate-400">
          <section>
            <p>
              <TodoBadge>회사명(상호)</TodoBadge>(이하 &ldquo;회사&rdquo;)는 「개인정보 보호법」 등 관련 법령에 따라 이용자의
              개인정보를 보호하고, 이와 관련한 고충을 신속하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>
          </section>

          <section>
            <h2>1. 수집하는 개인정보 항목 및 수집 방법</h2>
            <p className="mb-3">회사는 회원가입, 서비스 제공, 상담 등을 위해 아래와 같은 개인정보를 수집합니다.</p>
            <table>
              <thead>
                <tr>
                  <th className="w-1/4">구분</th>
                  <th className="w-1/2">수집 항목</th>
                  <th>수집 방법</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>회원가입</td>
                  <td>이메일(로그인 ID), 비밀번호(암호화 저장), 사용자 이름, 소속 회사/그룹명</td>
                  <td>홈페이지 회원가입</td>
                </tr>
                <tr>
                  <td>고객사 담당자 가입</td>
                  <td>고객사명, 고객사 코드</td>
                  <td>홈페이지 회원가입</td>
                </tr>
                <tr>
                  <td>서비스 이용 과정</td>
                  <td>접속 로그, 접속 IP, 서비스 이용기록</td>
                  <td>서비스 이용 과정에서 자동 수집</td>
                </tr>
                <tr>
                  <td>물류 업무 처리</td>
                  <td>배송지 주소, 수령인 연락처 등 (화주사가 입력하는 주문 정보에 한함)</td>
                  <td>서비스 내 주문/배송 등록</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>2. 개인정보의 수집 및 이용 목적</h2>
            <ul>
              <li>회원 가입 의사 확인, 본인 식별·인증, 회원자격 유지·관리</li>
              <li>주문·배차·배송·창고관리 등 서비스 제공 및 계약 이행</li>
              <li>서비스 관련 고지, 문의 응대, 불만 처리 등 민원 처리</li>
              <li>서비스 개선 및 신규 서비스 개발을 위한 통계 분석</li>
            </ul>
          </section>

          <section>
            <h2>3. 개인정보의 보유 및 이용기간</h2>
            <p>
              회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만,
              회원 탈퇴 시에도 관계 법령에 따라 일정 기간 보존이 필요한 경우 아래와 같이 보존합니다.
            </p>
            <ul className="mt-3">
              <li>회원 정보: 회원 탈퇴 시까지 (탈퇴 후 <TodoBadge>보존기간 입력</TodoBadge> 보관 후 파기)</li>
              <li>
                전자상거래 등에서의 소비자보호에 관한 법률에 따른 계약/청약철회, 대금결제, 재화 등의 공급기록: 5년
              </li>
              <li>통신비밀보호법에 따른 로그인 기록: 3개월</li>
            </ul>
          </section>

          <section>
            <h2>4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 이용자의 개인정보를 &ldquo;2. 수집 및 이용 목적&rdquo;에 명시한 범위 내에서만 처리하며, 이용자의
              사전 동의 없이는 동 범위를 초과하여 제3자에게 제공하지 않습니다. 다만, 법령에 특별한 규정이 있는
              경우는 예외로 합니다.
            </p>
          </section>

          <section>
            <h2>5. 개인정보처리의 위탁</h2>
            <p className="mb-3">회사는 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <table>
              <thead>
                <tr>
                  <th>수탁업체</th>
                  <th>위탁업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Supabase, Inc.</td>
                  <td>회원 인증(로그인) 및 계정 정보 저장</td>
                </tr>
                <tr>
                  <td><TodoBadge>호스팅사 입력</TodoBadge></td>
                  <td>서비스 운영을 위한 서버 호스팅</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>6. 이용자 및 법정대리인의 권리와 행사방법</h2>
            <p>
              이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 가입 해지(회원 탈퇴)를
              요청할 수 있습니다. 개인정보 조회, 수정, 삭제를 원하시는 경우 아래 개인정보보호책임자에게 서면,
              전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다.
            </p>
          </section>

          <section>
            <h2>7. 개인정보의 안전성 확보조치</h2>
            <p className="mb-3">회사는 개인정보 보호를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ul>
              <li>개인정보 암호화: 연락처, 주소 등 개인정보는 암호화하여 저장·관리합니다.</li>
              <li>접근 권한 관리: 담당자 역할에 따라 개인정보에 대한 조회·저장·삭제 권한을 최소한으로 제한합니다.</li>
              <li>조직 단위 데이터 분리: 회사(조직)별로 데이터가 분리되어 저장되어 다른 조직이 조회할 수 없습니다.</li>
              <li>접속기록 보관: 개인정보처리시스템에 접속한 기록을 보관·관리합니다.</li>
            </ul>
          </section>

          <section>
            <h2>8. 쿠키의 운영 및 거부</h2>
            <p>
              회사는 이용자에게 개인화되고 맞춤화된 서비스를 제공하기 위해 로그인 상태 유지 등의 목적으로
              쿠키(cookie)를 사용할 수 있습니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이
              경우 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.
            </p>
          </section>

          <section>
            <h2>9. 개인정보보호책임자</h2>
            <p className="mb-3">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및
              피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.
            </p>
            <ul>
              <li>성명: <TodoBadge>입력 필요</TodoBadge></li>
              <li>연락처: <TodoBadge>입력 필요</TodoBadge></li>
              <li>이메일: <TodoBadge>입력 필요</TodoBadge></li>
            </ul>
          </section>

          <section>
            <h2>10. 개인정보처리방침의 변경</h2>
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이
              있는 경우에는 변경사항의 시행 7일 전부터 홈페이지 공지사항을 통하여 고지합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
