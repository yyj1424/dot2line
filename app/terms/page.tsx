import Link from 'next/link';

export const metadata = {
  title: '이용약관 | DOT2LINE',
};

function TodoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[13px] font-medium align-middle">
      {children}
    </span>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <Link href="/" className="text-sm text-indigo-400 hover:underline">
          ← 홈으로
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mt-6 mb-2">이용약관</h1>
        <p className="text-sm text-slate-500 mb-10">
          시행일: <TodoBadge>YYYY-MM-DD 입력 필요</TodoBadge>
        </p>

        <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200 leading-relaxed">
          이 문서는 표준 이용약관 양식을 바탕으로 작성된 초안입니다.{' '}
          <TodoBadge>노란색으로 표시된 항목</TodoBadge>은 실제 사업자 정보로 반드시 교체해야 하며,
          정식 서비스 오픈 전 법률 검토를 받는 것을 권장합니다.
        </div>

        <div className="space-y-10 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-50 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2">
          <section>
            <h2>제1조 (목적)</h2>
            <p>
              이 약관은 <TodoBadge>회사명(상호)</TodoBadge>(이하 &ldquo;회사&rdquo;)이 제공하는 물류 통합 관리
              플랫폼 &ldquo;DOT2LINE&rdquo;(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자의 권리,
              의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2>제2조 (정의)</h2>
            <ol>
              <li>&ldquo;서비스&rdquo;란 회사가 제공하는 기준정보(MDM), 창고관리(WMS), 배송관리(TMS) 등 물류 통합 관리 기능 일체를 의미합니다.</li>
              <li>&ldquo;이용자&rdquo;란 이 약관에 따라 회사와 이용계약을 체결하고 서비스를 이용하는 회원을 말합니다.</li>
              <li>&ldquo;그룹(조직)&rdquo;이란 서비스 내에서 하나의 회사 단위로 데이터를 관리하는 단위를 의미합니다.</li>
              <li>&ldquo;계정&rdquo;이란 이용자의 식별과 서비스 이용을 위해 이용자가 설정한 이메일 및 비밀번호의 조합을 말합니다.</li>
            </ol>
          </section>

          <section>
            <h2>제3조 (약관의 효력 및 변경)</h2>
            <ol>
              <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 적용일 7일 전부터 공지합니다. 다만 이용자에게 불리한 변경의 경우 30일 전에 공지합니다.</li>
              <li>이용자가 개정약관의 적용에 동의하지 않는 경우 회원 탈퇴를 요청할 수 있으며, 공지 후에도 서비스를 계속 이용하는 경우 약관의 변경에 동의한 것으로 간주됩니다.</li>
            </ol>
          </section>

          <section>
            <h2>제4조 (서비스의 제공 및 변경)</h2>
            <ol>
              <li>회사는 이용자에게 아래와 같은 서비스를 제공합니다.
                <ul className="mt-2">
                  <li>기준정보(MDM) 관리 서비스</li>
                  <li>창고관리(WMS) 서비스</li>
                  <li>배송관리(TMS) 서비스</li>
                  <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
                </ul>
              </li>
              <li>회사는 서비스의 내용, 운영상·기술상 필요에 따라 제공하는 서비스의 전부 또는 일부를 변경할 수 있으며, 이 경우 변경 사유와 내용을 사전에 공지합니다.</li>
              <li>회사는 무료로 제공되는 서비스의 일부 또는 전부를 회사의 정책 및 운영의 필요상 수정, 중단, 변경할 수 있으며, 이에 대해 관련법에 특별한 규정이 없는 한 이용자에게 별도의 보상을 하지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2>제5조 (서비스 이용신청 및 가입)</h2>
            <ol>
              <li>이용자는 회사가 정한 가입 양식에 따라 이메일, 비밀번호, 이름 등 필요한 정보를 기입하여 이용신청을 합니다.</li>
              <li>회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.
                <ul className="mt-2">
                  <li>타인의 정보를 도용하여 신청한 경우</li>
                  <li>허위의 정보를 기재하거나 회사가 제시하는 내용을 기재하지 않은 경우</li>
                  <li>기타 회사가 정한 이용신청 요건을 충족하지 못한 경우</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2>제6조 (이용자의 의무)</h2>
            <ol>
              <li>이용자는 관계 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 합니다.</li>
              <li>이용자는 자신의 계정 정보를 제3자에게 이용하게 해서는 안 되며, 계정 정보 관리 소홀로 인해 발생하는 불이익에 대해 회사는 책임을 지지 않습니다.</li>
              <li>이용자는 서비스를 이용하여 등록하는 주문, 배송지, 상품 등 정보의 정확성에 대해 책임을 지며, 타인의 개인정보를 부정하게 입력해서는 안 됩니다.</li>
              <li>이용자는 서비스의 안정적 운영을 방해하는 행위(비정상적인 방법으로 서비스에 접근, 서버에 과도한 부하를 일으키는 행위 등)를 해서는 안 됩니다.</li>
            </ol>
          </section>

          <section>
            <h2>제7조 (서비스 이용요금)</h2>
            <p>
              회사는 서비스의 전부 또는 일부를 무료로 제공하고 있습니다. 향후 유료 서비스를 도입하는 경우, 요금
              및 결제 방법 등 세부 사항은 사전에 서비스 내 공지 및 별도의 약관을 통해 안내합니다.
            </p>
          </section>

          <section>
            <h2>제8조 (서비스 제공의 중지)</h2>
            <p className="mb-2">회사는 다음 각 호에 해당하는 경우 서비스 제공을 일시적으로 중지할 수 있습니다.</p>
            <ul>
              <li>서비스용 설비의 보수 등 공사로 인한 부득이한 경우</li>
              <li>정전, 서비스 설비의 장애, 서비스 이용의 폭주 등으로 정상적인 서비스 제공이 어려운 경우</li>
              <li>기타 천재지변, 국가비상사태 등 회사가 통제할 수 없는 사유가 발생한 경우</li>
            </ul>
          </section>

          <section>
            <h2>제9조 (면책조항)</h2>
            <ol>
              <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우 서비스 제공에 관한 책임이 면제됩니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 이용자가 서비스에 게재한 정보, 자료의 신뢰도, 정확성에 대해 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2>제10조 (분쟁해결 및 관할법원)</h2>
            <p>
              이 약관과 관련하여 회사와 이용자 간에 발생한 분쟁에 대해서는 대한민국 법을 적용하며, 분쟁으로 인한
              소송이 제기될 경우 <TodoBadge>관할법원 입력</TodoBadge>을 관할 법원으로 합니다.
            </p>
          </section>

          <section>
            <h2>부칙</h2>
            <p>이 약관은 <TodoBadge>YYYY-MM-DD</TodoBadge>부터 시행합니다.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
