import { NextRequest, NextResponse } from 'next/server';

// 배송조회 페이지에서 수취인이 남기는 문의. 인증은 배송조회 토큰이며 서버(Spring)가 토큰이 가리키는 주문에만 접수·조회를 허용한다.
// 접수 횟수 제한이 실제 접속자 기준으로 걸리도록 원 접속자 주소를 그대로 넘긴다.
const springApiUrl = () => process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';
const down = () => NextResponse.json({ success: false, message: '배송 조회 서버와 통신할 수 없습니다.' }, { status: 502 });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const res = await fetch(`${springApiUrl()}/api/public/track/${encodeURIComponent(token)}/inquiry`, { cache: 'no-store' });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return down();
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  // 허용한 필드만 전달한다(주문·조직 같은 값은 서버가 토큰에서 정하므로 보내지 않는다).
  const b = (body ?? {}) as Record<string, unknown>;
  const payload = { categoryCd: b.categoryCd, content: b.content, contact: b.contact, requestKey: b.requestKey };
  try {
    const res = await fetch(`${springApiUrl()}/api/public/track/${encodeURIComponent(token)}/inquiry`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': req.headers.get('x-forwarded-for') || '' },
      body: JSON.stringify(payload),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return down();
  }
}
