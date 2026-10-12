import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; photoId: string }> }
) {
  const { token, photoId } = await params;
  const springApiUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

  try {
    const res = await fetch(
      `${springApiUrl}/api/public/track/${encodeURIComponent(token)}/photo/${encodeURIComponent(photoId)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 502 });
  }
}
