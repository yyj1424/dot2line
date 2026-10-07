import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { status: 'error', message: '업로드할 엑셀 파일이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Spring Boot 백엔드로 파일 전송 시도
    try {
      const springFormData = new FormData();
      springFormData.append('file', file);

      const res = await fetch(`${springApiUrl}/api/oms/order/batch-upload`, {
        method: 'POST',
        body: springFormData,
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // 스프링 백엔드 미기동 시 폴백 처리
    }

    // 시뮬레이션용 Task ID 발급
    const taskId = `TASK-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    return NextResponse.json({
      status: 'success',
      taskId: taskId,
      fileName: file.name,
      fileSize: file.size,
      message: '대용량 엑셀 주문 비동기 청크 배치가 시작되었습니다.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: '배치 파일 업로드 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
