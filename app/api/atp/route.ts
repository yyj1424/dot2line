import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const body = await req.json();
    const res = await fetch(`${springApiUrl}/api/oms/atp/calculate`, {
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

    // 서버 미기동 시 클라이언트 시뮬레이션용 폴백
    const today = new Date();
    const promiseDate = new Date(today);
    promiseDate.setDate(today.getDate() + 2);

    const fallbackDateStr = promiseDate.toISOString().slice(0, 10).replace(/-/g, '');
    return NextResponse.json({
      success: true,
      data: {
        orgCode: body.orgCode || 'ORG01',
        centerCd: body.centerCd || 'IC01',
        productId: body.productId || 101,
        promisedDeliveryDate: fallbackDateStr,
        fastestDeliveryDate: fallbackDateStr,
        availableStockQty: 48.0,
        allocatedStockQty: 12.0,
        effectiveStockQty: 36.0,
        assignedCenterCd: body.centerCd || 'IC01',
        assignedCenterNm: '수도권 통합 이천물류센터',
        assignedZoneNm: '서울/경기 중부권역',
        atpType: 'IMMEDIATE_STOCK',
        reason: '당일 재고 확보 및 권역 배송 CAPA(잔여 18CBM) 여유 확인',
        cutoffPassed: false,
        leadTimeDays: 2,
        availableSlots: [
          { date: fallbackDateStr, capacityScore: 85.0, status: 'OPEN', description: '오전/오후 배송 확정 가능' }
        ]
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'ATP 산출 서비스와 통신할 수 없습니다.' },
      { status: 502 }
    );
  }
}
