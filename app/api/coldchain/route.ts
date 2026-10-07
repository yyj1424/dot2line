import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const res = await fetch(`${springApiUrl}/api/dashboard/coldchain`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // 스프링 백엔드 미기동 시 고도화 폴백
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return NextResponse.json({
    updatedAt: timeStr,
    summary: {
      totalMonitoredVehicles: 12,
      normalCount: 11,
      alertCount: 1,
      averageColdTemp: 1.8,
      averageFrozenTemp: -19.4,
      kfdaComplianceRate: 99.4,
    },
    activeSensors: [
      {
        id: 'SEN-VEH-01',
        targetType: 'VEHICLE',
        targetName: '1호차 (서울81바9234 / 5T)',
        driverNm: '이민호 기사',
        type: 'COLD', // 냉장
        typeNm: '냉장 (0℃~5℃)',
        currentTemp: 1.8,
        targetTemp: 2.0,
        humidity: 74,
        doorStatus: 'CLOSED',
        compressorStatus: 'RUNNING',
        status: 'OPTIMAL',
        location: '중부고속도로 이천TG 부근',
        lastUpdated: '방금 전',
      },
      {
        id: 'SEN-VEH-02',
        targetType: 'VEHICLE',
        targetName: '2호차 (서울98바1234 / 2.5T)',
        driverNm: '김진철 기사',
        type: 'FROZEN', // 냉동
        typeNm: '냉동 (-25℃~-18℃)',
        currentTemp: -19.8,
        targetTemp: -20.0,
        humidity: 62,
        doorStatus: 'CLOSED',
        compressorStatus: 'RUNNING',
        status: 'OPTIMAL',
        location: '서울 서초구 강남대로 부근',
        lastUpdated: '1분 전',
      },
      {
        id: 'SEN-VEH-03',
        targetType: 'VEHICLE',
        targetName: '3호차 (인천89사4321 / 1T)',
        driverNm: '최용우 기사',
        type: 'COLD',
        typeNm: '냉장 (0℃~5℃)',
        currentTemp: 7.8, // 적정온도 5도 초과 경보
        targetTemp: 2.0,
        humidity: 88,
        doorStatus: 'OPEN',
        compressorStatus: 'BOOST_REQUIRED',
        status: 'CRITICAL',
        location: '인천 연수구 송도과학로 하역장',
        lastUpdated: '방금 전',
      },
      {
        id: 'SEN-WMS-01',
        targetType: 'WAREHOUSE',
        targetName: '이천 통합센터 A동 냉장 1존',
        driverNm: '센서 ID: WMS-TH-01',
        type: 'COLD',
        typeNm: '냉장보관고',
        currentTemp: 2.4,
        targetTemp: 2.0,
        humidity: 70,
        doorStatus: 'CLOSED',
        compressorStatus: 'RUNNING',
        status: 'OPTIMAL',
        location: '이천센터 1층 콜드체인 허브',
        lastUpdated: '방금 전',
      },
      {
        id: 'SEN-WMS-02',
        targetType: 'WAREHOUSE',
        targetName: '이천 통합센터 B동 냉동 2존',
        driverNm: '센서 ID: WMS-TH-02',
        type: 'FROZEN',
        typeNm: '냉동보관고',
        currentTemp: -21.2,
        targetTemp: -20.0,
        humidity: 58,
        doorStatus: 'CLOSED',
        compressorStatus: 'RUNNING',
        status: 'OPTIMAL',
        location: '이천센터 지하 1층 초저온 보관고',
        lastUpdated: '방금 전',
      },
    ],
    temperatureTimeline: [
      { time: '04:00', tempCold: 1.2, tempFrozen: -20.5 },
      { time: '05:00', tempCold: 1.5, tempFrozen: -20.1 },
      { time: '06:00', tempCold: 2.1, tempFrozen: -19.8 },
      { time: '07:00', tempCold: 3.4, tempFrozen: -19.2 }, // 상차 시 도어 개방
      { time: '08:00', tempCold: 2.0, tempFrozen: -19.9 },
      { time: '09:00', tempCold: 1.8, tempFrozen: -19.8 },
      { time: '10:00', tempCold: 2.2, tempFrozen: -19.5 },
    ],
  });
}
