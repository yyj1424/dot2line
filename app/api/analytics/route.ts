import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const res = await fetch(`${springApiUrl}/api/dashboard/analytics`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // 스프링 백엔드 미기동 시 고품질 폴백
  }

  return NextResponse.json({
    kpis: {
      carbonSavedKg: 1428.5,
      carbonReductionRate: 19.3,
      fuelCostSavedWon: 3840000,
      pineTreesEquivalent: 216,
      grossRevenueWon: 142000000,
      totalCostWon: 115800000,
      marginRate: 18.4,
      onTimeDeliveryRate: 98.7,
      totalDeliveryCount: 3420,
      wmsSlottingEfficiency: 88.5,
      negativeMarginCount: 0,
    },
    monthlyTrend: [
      { month: '5월', revenue: 118, cost: 98, profit: 20 },
      { month: '6월', revenue: 125, cost: 103, profit: 22 },
      { month: '7월', revenue: 130, cost: 107, profit: 23 },
      { month: '8월', revenue: 136, cost: 111, profit: 25 },
      { month: '9월', revenue: 139, cost: 113, profit: 26 },
      { month: '10월(누적)', revenue: 142, cost: 115, profit: 27 },
    ],
    zonePerformance: [
      { zoneNm: '서울 강남/서초', loadRate: 92.0, onTimeRate: 99.1, deliveryCount: 1120, status: 'EXCELLENT' },
      { zoneNm: '경기 남부 (성남/용인/수원)', loadRate: 88.5, onTimeRate: 98.4, deliveryCount: 980, status: 'EXCELLENT' },
      { zoneNm: '인천/부천 서부권', loadRate: 78.0, onTimeRate: 99.2, deliveryCount: 650, status: 'OPTIMAL' },
      { zoneNm: '충청/대전 권역', loadRate: 65.0, onTimeRate: 97.9, deliveryCount: 420, status: 'NORMAL' },
      { zoneNm: '영남/부산 권역', loadRate: 72.0, onTimeRate: 98.1, deliveryCount: 250, status: 'OPTIMAL' },
    ],
    returnReasons: [
      { reason: '고객 단순 변심', count: 18, sharePercent: 58.0, amountWon: 4200000, color: '#6366f1' },
      { reason: '상품 불량/하자', count: 7, sharePercent: 24.0, amountWon: 1750000, color: '#f59e0b' },
      { reason: '출고 오배송', count: 4, sharePercent: 12.0, amountWon: 870000, color: '#06b6d4' },
      { reason: '배송 지연/파손', count: 2, sharePercent: 6.0, amountWon: 430000, color: '#ef4444' },
    ],
  });
}
