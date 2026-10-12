import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNo = searchParams.get('orderNo');
  const telLast4 = searchParams.get('telLast4');

  if (!orderNo || !telLast4) {
    return NextResponse.json(
      { success: false, message: '주문번호와 수취인 전화번호 뒤 4자리를 입력해 주세요.' },
      { status: 400 }
    );
  }

  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const res = await fetch(
      `${springApiUrl}/api/public/track/search?orderNo=${encodeURIComponent(orderNo)}&telLast4=${encodeURIComponent(telLast4)}`,
      {
        cache: 'no-store',
        // 조회 실패 횟수 제한이 실제 접속자 기준으로 걸리도록 원 접속자 주소를 넘긴다.
        headers: { 'X-Forwarded-For': req.headers.get('x-forwarded-for') || '' },
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '배송 조회 서버와 통신할 수 없습니다.' },
      { status: 502 }
    );
  }
}
