import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ status: 'error', message: '인증 토큰이 없습니다.' }, { status: 401 });
  }
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';
  try {
    const res = await fetch(`${springApiUrl}/api/dashboard/wms-summary`, {
      headers: { Authorization: authorization, Accept: 'application/json' },
      cache: 'no-store',
    });
    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ status: 'error', message: '창고 요약 조회 중 오류가 발생했습니다.' }, { status: 502 });
  }
}
