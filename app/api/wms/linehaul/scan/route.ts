import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const body = await req.json();
    const { linehaulBarcode, workerCenterCd, orgCode } = body;

    // 1. Spring Boot 백엔드로 간선 입고 스캔 요청 프록시 시도
    try {
      const res = await fetch(`${springApiUrl}/api/wms/linehaul/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // 스프링 백엔드 미기동 시 폴백 처리
    }

    // 2. 고도화된 간선 입고 및 오도착 방지 시뮬레이션
    const barcode = (linehaulBarcode || '').trim().toUpperCase();
    const currentCenter = workerCenterCd || 'IC01';

    // 오도착 시뮬레이션: 바코드에 'WRONG'이 포함되었거나 도착 예정 센터가 용인인데 현재 센터가 이천인 경우
    if (barcode.includes('WRONG') || (barcode.includes('YI01') && currentCenter === 'IC01')) {
      return NextResponse.json({
        isSuccess: false,
        isWrongCenter: true,
        linehaulBarcode: barcode,
        expectedCenterCd: 'YI01',
        workerCenterCd: currentCenter,
        message: `[오도착 차단 경보] 해당 간선 화물은 용인물류센터(YI01) 착지 전표입니다. 현재 센터(${currentCenter}) 입고가 원천 차단되었습니다. 회차 지시 바랍니다.`,
        suggestedPutawayLocCd: null,
        putawayOrderId: null,
        scanStatus: 'WRONG_CENTER_BLOCKED',
      });
    }

    // 정상 입고 및 로케이션 자동 적치 배정
    const putawayOrderId = 600000 + Math.floor(Math.random() * 10000);
    const rackAisles = ['A-01', 'A-02', 'B-01', 'B-03'];
    const aisle = rackAisles[Math.floor(Math.random() * rackAisles.length)];
    const bay = Math.floor(1 + Math.random() * 8);
    const tier = Math.floor(1 + Math.random() * 4);
    const suggestedLoc = `${aisle}-0${bay}-0${tier}`;

    return NextResponse.json({
      isSuccess: true,
      isWrongCenter: false,
      linehaulBarcode: barcode || 'PA-LH-IC01-8842',
      expectedCenterCd: currentCenter,
      workerCenterCd: currentCenter,
      inboundPlanId: 500124,
      putawayOrderId: putawayOrderId,
      suggestedPutawayLocCd: suggestedLoc,
      totalBoxCount: 18,
      totalWeightKg: 240.5,
      carrierNm: 'D2L 직영 11T 간선간선셔틀 (서울98바1234)',
      scanStatus: 'INBOUND_COMPLETED',
      message: `[입고 승인] 간선 전표(${barcode}) 검수 완료: 최적 골든존 로케이션 [${suggestedLoc}] 적치 지시가 발행되었습니다.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { isSuccess: false, message: '간선 입고 검수 서비스와 통신할 수 없습니다.' },
      { status: 502 }
    );
  }
}
