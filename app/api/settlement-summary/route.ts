import { NextRequest, NextResponse } from 'next/server';

// 브라우저의 Supabase access token을 그대로 넘겨받아, 서버(Vercel)에서 대신 transys2를 호출한다.
// 브라우저가 cafe24 도메인을 직접 호출하지 않으므로 CORS를 열 필요가 없다.
export async function GET(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ status: 'error', message: '인증 토큰이 없습니다.' }, { status: 401 });
  }

  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const res = await fetch(`${springApiUrl}/api/dashboard/settlement-summary`, {
      headers: { Authorization: authorization, Accept: 'application/json' },
      cache: 'no-store',
    });
    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch (e) {
    return NextResponse.json({ status: 'error', message: '정산 요약 조회 중 오류가 발생했습니다.' }, { status: 502 });
  }
}
