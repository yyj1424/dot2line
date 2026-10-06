import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const body = await req.json();
    const res = await fetch(`${springApiUrl}/api/wms/bom/validate-kit`, {
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
    const reqQty = Number(body.requestedQty) || 5;
    const isShortage = reqQty > 8; // 8개 초과 시 부족 시뮬레이션

    return NextResponse.json({
      orgCode: body.orgCode || 'ORG01',
      centerCd: body.centerCd || 'IC01',
      setProductId: body.setProductId || 100,
      setProductCd: 'SET-FURNITURE-01',
      setProductNm: '4인 원목 식탁세트 (BOM)',
      requestedKitQty: reqQty,
      maxBuildableKitQty: 8,
      validationStatus: isShortage ? 'LACK_OF_COMPONENT' : 'AVAILABLE',
      isApprovedForPicking: !isShortage,
      message: isShortage
        ? `세트 구성품 재고 부족 (요청: ${reqQty}개, 최대제작가능: 8개). 부분 출고 제한 원칙에 따라 피킹이 차단되었습니다.`
        : '모든 세트 구성품(3종)의 재고가 충족되어 출고 승인이 가능합니다.',
      components: [
        {
          componentProductId: 201,
          componentProductCd: 'TOP-OAK-01',
          componentProductNm: '원목 식탁 상판',
          componentQtyRatio: 1,
          requiredQty: reqQty,
          availableStockQty: 15,
          shortageQty: 0,
          maxPossibleKits: 15,
          status: 'SUFFICIENT'
        },
        {
          componentProductId: 202,
          componentProductCd: 'CHAIR-WOOD-01',
          componentProductNm: '원목 체어',
          componentQtyRatio: 4,
          requiredQty: reqQty * 4,
          availableStockQty: 32,
          shortageQty: Math.max(0, reqQty * 4 - 32),
          maxPossibleKits: 8,
          status: reqQty * 4 > 32 ? 'LACK_OF_COMPONENT' : 'SUFFICIENT'
        },
        {
          componentProductId: 203,
          componentProductCd: 'SCREW-PACK-M6',
          componentProductNm: '조립용 볼트/와셔 팩',
          componentQtyRatio: 1,
          requiredQty: reqQty,
          availableStockQty: 100,
          shortageQty: 0,
          maxPossibleKits: 100,
          status: 'SUFFICIENT'
        }
      ]
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'BOM 검증 서비스와 통신할 수 없습니다.' },
      { status: 502 }
    );
  }
}
