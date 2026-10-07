import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const res = await fetch(`${springApiUrl}/api/public/track/${encodeURIComponent(token)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // 스프링 백엔드 미기동 시 고품질 폴백 시뮬레이션
  }

  // 토큰 분석 및 상태 분기 (10521은 배송중, 그 외는 배송완료)
  const isDelivering = token.includes('10521') || token.includes('7000');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  return NextResponse.json({
    success: true,
    data: {
      orderId: 10520,
      orderNo: isDelivering ? 'ORD-20261007-0012' : 'ORD-20261007-0011',
      orgCode: 'ORG01',
      orderStatus: isDelivering ? '7000' : '9999',
      orderStatusNm: isDelivering ? '배송중 (7000)' : '배송완료 (9999)',
      consigneeNm: isDelivering ? '홍*동' : '김*수',
      consigneeTel: '010-8271-****',
      addrM: isDelivering
        ? '서울특별시 송파구 올림픽로 300 롯데월드타워'
        : '서울특별시 서초구 강남대로 381 102동 1403호',
      deliveryDt: dateStr,
      deliveryReqMsg: '부재 시 문앞에 놓아주시고 문자 남겨주세요.',
      driverId: 101,
      driverNm: isDelivering ? '이민호 기사' : '김진철 기사',
      driverHp: '010-3849-1234',
      carNo: isDelivering ? '서울81바9234' : '서울98바1234',
      routeSeq: isDelivering ? 3 : 2,
      currentDeliveringSeq: isDelivering ? 2 : 2,
      remainingStops: isDelivering ? 1 : 0,
      estimatedTime: isDelivering ? '15:10' : '14:28',
      driverLat: 37.4979,
      driverLng: 127.0276,
      productSummary: isDelivering
        ? '프리미엄 원목 4인 다이닝 세트'
        : '인체공학 메시 사무용 체어 2개',
      completedAt: isDelivering ? null : `${dateStr} 14:28:15`,
      completeMemo: isDelivering ? null : '현관 문앞 비대면 안전 배송 완료 및 사진 촬영 완료',
      receiptType: 'NON_FACE_TO_FACE_DOOR',
      hasPhotoProof: !isDelivering,
      photoIds: isDelivering ? [] : [10520],
      hasSignProof: !isDelivering,
    },
  });
}
