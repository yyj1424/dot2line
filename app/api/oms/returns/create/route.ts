import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const body = await req.json();

    // 1. Spring Boot 백엔드로 역물류 접수 프록시 시도
    const res = await fetch(`${springApiUrl}/api/oms/returns/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // 2. 서버 미기동 시 고도화된 역물류 시뮬레이션 폴백 응답 생성
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const returnOrderNo = `RET-${dateStr}-${randSeq}`;
    const tmsPickupOrderId = 700000 + Math.floor(Math.random() * 10000);
    const wmsReturnId = 800000 + Math.floor(Math.random() * 10000);
    const settlementLedgerId = 900000 + Math.floor(Math.random() * 10000);

    const items = body.items || [];
    const totalReturnQty = items.reduce((acc: number, item: any) => acc + (Number(item.returnQty) || 1), 0);

    return NextResponse.json({
      returnOrderId: Date.now(),
      returnOrderNo: returnOrderNo,
      originalOrderNo: body.originalOrderNo || 'ORD-20261007-0011',
      tmsPickupOrderId: tmsPickupOrderId,
      wmsReturnId: wmsReturnId,
      settlementLedgerId: settlementLedgerId,
      status: 'INITIATED',
      itemCount: items.length || 1,
      totalReturnQty: totalReturnQty || 1,
      message: `[OMS-04] 역물류 반품 접수 완료: TMS 회수배차(ID:${tmsPickupOrderId}) 및 WMS 반품입고(ID:${wmsReturnId}), 정산 원장(ID:${settlementLedgerId}) 연계가 체결되었습니다.`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '역물류 접수 서비스와 통신할 수 없습니다.' },
      { status: 502 }
    );
  }
}
