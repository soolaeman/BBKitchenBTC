import { NextRequest, NextResponse } from 'next/server';

declare global {
  // eslint-disable-next-line no-var
  var __bbk_audit_timestamps: Record<string, string> | undefined;
  // eslint-disable-next-line no-var
  var __bbk_active_sku: string | null | undefined;
}

if (!global.__bbk_audit_timestamps) {
  global.__bbk_audit_timestamps = {};
}
if (global.__bbk_active_sku === undefined) {
  global.__bbk_active_sku = null;
}

export async function GET() {
  return NextResponse.json({
    timestamps: global.__bbk_audit_timestamps,
    activeSku: global.__bbk_active_sku,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, timestamp, batch, activeSku } = body;

    if (batch && typeof batch === 'object') {
      Object.assign(global.__bbk_audit_timestamps!, batch);
    }
    if (sku && timestamp) {
      global.__bbk_audit_timestamps![sku] = timestamp;
      global.__bbk_active_sku = sku;
    }
    if (activeSku !== undefined) {
      global.__bbk_active_sku = activeSku;
    }

    return NextResponse.json({
      success: true,
      timestamps: global.__bbk_audit_timestamps,
      activeSku: global.__bbk_active_sku,
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
