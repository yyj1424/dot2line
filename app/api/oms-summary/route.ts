import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ status: 'error', message: '인증 토큰이 없습니다.' }, { status: 401 });
  }

  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const res = await fetch(`${springApiUrl}/api/dashboard/oms-summary`, {
      headers: { Authorization: authorization, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const body = await res.json();
      return NextResponse.json(body);
    }
  } catch {
    // 스프링 백엔드 미기동 시 폴백 데이터 제공
  }

  // 폴백 고도화 데이터
  return NextResponse.json({
    todayOrderTotal: 142,
    todayOrderConfirmed: 138,
    channelOrderCount: 94,
    splitOrderCount: 16,
    returnOrderCount: 8,
    atpPassRate: 97.2,
    channelBreakdown: [
      { channelNm: '네이버 스마트스토어', count: 34, sharePercent: 36.2 },
      { channelNm: '쿠팡 윙 (로켓그로스)', count: 48, sharePercent: 51.1 },
      { channelNm: '11번가 오픈마켓', count: 12, sharePercent: 12.7 },
    ],
    recentOrders: [
      {
        orderNo: 'ORD-20261007-0094',
        channelNm: '네이버 스마트스토어',
        channelOrderNo: 'NV-20261007-0094',
        consigneeNm: '홍*동',
        deliveryAddr: '서울특별시 송파구 올림픽로 300',
        productSummary: '원목 4인 다이닝 세트 외 1건',
        assignedCenterNm: '이천 / 용인 센터 (분할출고)',
        promisedDeliveryDate: '2026-10-09',
        orderStatus: 'SPLIT_CONFIRMED',
        orderStatusNm: '다거점 분할확정',
        totalAmt: 480000,
      },
      {
        orderNo: 'ORD-20261007-0093',
        channelNm: '쿠팡 윙',
        channelOrderNo: 'CP-20261007-0182',
        consigneeNm: '김*수',
        deliveryAddr: '서울특별시 서초구 강남대로 381',
        productSummary: '인체공학 메시 사무용 체어 2개',
        assignedCenterNm: '수도권 통합 이천센터',
        promisedDeliveryDate: '2026-10-08',
        orderStatus: 'ALLOCATED',
        orderStatusNm: '재고할당 완료',
        totalAmt: 220000,
      },
      {
        orderNo: 'ORD-20261007-0092',
        channelNm: 'B2B 위탁 수기',
        channelOrderNo: 'MANUAL-0092',
        consigneeNm: '이*진',
        deliveryAddr: '경기도 성남시 분당구 판교역로 166',
        productSummary: '스마트 높낮이 전동 데스크 1400',
        assignedCenterNm: '수도권 통합 이천센터',
        promisedDeliveryDate: '2026-10-08',
        orderStatus: 'PICKING',
        orderStatusNm: '피킹 지시중',
        totalAmt: 350000,
      },
      {
        orderNo: 'ORD-20261007-0091',
        channelNm: '11번가 오픈마켓',
        channelOrderNo: '11-20261007-0031',
        consigneeNm: '박*훈',
        deliveryAddr: '인천광역시 연수구 송도과학로 32',
        productSummary: '모던 패브릭 3인 소파 베이지',
        assignedCenterNm: '용인물류센터 (YI01)',
        promisedDeliveryDate: '2026-10-09',
        orderStatus: 'DELIVERING',
        orderStatusNm: '배송출발 (7000)',
        totalAmt: 620000,
      },
      {
        orderNo: 'RET-20261007-0001',
        channelNm: '반품/역물류',
        channelOrderNo: 'ORD-20261006-0081',
        consigneeNm: '최*희',
        deliveryAddr: '경기도 용인시 기흥구 흥덕중앙로 120',
        productSummary: '원목 체어 A세트 (단순변심 반품)',
        assignedCenterNm: '수도권 통합 이천센터 (입고대기)',
        promisedDeliveryDate: '2026-10-08',
        orderStatus: 'RETURN_PICKUP',
        orderStatusNm: '회수 배차중',
        totalAmt: 120000,
      }
    ]
  });
}
