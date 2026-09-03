import { NextRequest, NextResponse } from 'next/server';

// Global in-memory cache shared across desktop and mobile devices
declare global {
  // eslint-disable-next-line no-var
  var __bbk_audit_timestamps: Record<string, string> | undefined;
}

const globalStore = global.__bbk_audit_timestamps || {};
global.__bbk_audit_timestamps = globalStore;

export async function GET() {
  return NextResponse.json({ timestamps: globalStore });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, timestamp, batch } = body;

    if (batch && typeof batch === 'object') {
      Object.assign(globalStore, batch);
    } else if (sku && timestamp) {
      globalStore[sku] = timestamp;
    }

    return NextResponse.json({ success: true, timestamps: globalStore });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
