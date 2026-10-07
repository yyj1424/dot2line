import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const body = await req.json();

    // 1. Spring Boot 백엔드로 견적 계산 프록시 시도
    try {
      const res = await fetch(`${springApiUrl}/api/commercial/quotation/calculate`, {
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

    // 2. QuotationCalculator 기반 견적 계산
    const partyName = body.partyName || '위탁 의뢰 화주사';
    const lines = body.lines || [];

    let supplySum = 0;
    let taxSum = 0;

    const calculatedLines = lines.map((l: any, idx: number) => {
      const qty = Number(l.quantity) || 1;
      const price = Number(l.unitPrice) || 0;
      const amount = Math.round(qty * price);
      const vat = l.taxType === 'TAXABLE' ? Math.round(amount * 0.10) : 0;
      const total = amount + vat;

      supplySum += amount;
      taxSum += vat;

      return {
        seq: idx + 1,
        stableKey: l.stableKey || `LINE-${idx + 1}`,
        domain: l.domain || 'WMS',
        itemName: l.itemName || '서비스 항목',
        unit: l.unit || 'PLT',
        quantity: qty,
        unitPrice: price,
        taxType: l.taxType || 'TAXABLE',
        supplyAmount: amount,
        taxAmount: vat,
        totalAmount: total,
        note: l.note || '',
      };
    });

    const quotationNo = `QUO-20261007-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      quotationNo,
      partyName,
      title: body.title || `${partyName} 2026년 하반기 통합 물류 위탁 견적서`,
      basisPeriod: body.basisPeriod || '2026-10-07 ~ 2027-10-06 (1년)',
      validTo: '20261107',
      lines: calculatedLines,
      supplyAmount: supplySum,
      taxAmount: taxSum,
      totalAmount: supplySum + taxSum,
      status: 'CALCULATED',
      message: '표준 물류 위탁 견적 산출이 완료되었습니다.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '견적 산출 서비스와 통신할 수 없습니다.' },
      { status: 502 }
    );
  }
}
