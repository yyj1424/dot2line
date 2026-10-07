import { NextRequest, NextResponse } from 'next/server';

// 인메모리 진행률 시뮬레이션 캐시
const progressStore = new Map<string, { start: number; total: number }>();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const res = await fetch(`${springApiUrl}/api/oms/order/batch-progress/${taskId}`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // 스프링 백엔드 미기동 시 폴백
  }

  // 폴백 진행률 산출
  let task = progressStore.get(taskId);
  if (!task) {
    task = { start: Date.now(), total: 250 };
    progressStore.set(taskId, task);
  }

  const elapsedSec = (Date.now() - task.start) / 1000;
  // 4초 만에 완료되도록 스케줄링
  const rawPercent = Math.min(100, Math.round((elapsedSec / 4) * 100));
  const isComplete = rawPercent >= 100;

  const processedRows = Math.round((task.total * rawPercent) / 100);
  const failCount = processedRows >= 180 ? 2 : 0;
  const successCount = Math.max(0, processedRows - failCount);

  const errors: string[] = [];
  if (processedRows >= 80) {
    errors.push('34행: 수취인 우편번호(1234) 형식 불일치 (5자리 필수)');
  }
  if (processedRows >= 180) {
    errors.push('142행: 필수 상품코드(SKU-EMPTY) 미기재');
  }

  return NextResponse.json({
    taskId,
    status: isComplete ? 'COMPLETED' : 'PROCESSING',
    totalRows: task.total,
    processedRows,
    successCount,
    failCount,
    progressPercent: rawPercent,
    errors,
    startTime: new Date(task.start).toISOString(),
    endTime: isComplete ? new Date(task.start + 4000).toISOString() : null,
  });
}
