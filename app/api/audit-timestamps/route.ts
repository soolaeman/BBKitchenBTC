import { NextRequest, NextResponse } from 'next/server';

export interface SoldNotice {
  id: string;
  sku: string;
  dealPrice?: number;
  notes?: string;
  reportedAt: string;
  reportedBy?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __bbk_audit_timestamps: Record<string, string> | undefined;
  // eslint-disable-next-line no-var
  var __bbk_active_sku: string | null | undefined;
  // eslint-disable-next-line no-var
  var __bbk_sold_notices: SoldNotice[] | undefined;
}

if (!global.__bbk_audit_timestamps) {
  global.__bbk_audit_timestamps = {};
}
if (global.__bbk_active_sku === undefined) {
  global.__bbk_active_sku = null;
}
if (!global.__bbk_sold_notices) {
  global.__bbk_sold_notices = [];
}

export async function GET() {
  return NextResponse.json({
    timestamps: global.__bbk_audit_timestamps,
    activeSku: global.__bbk_active_sku,
    soldNotices: global.__bbk_sold_notices,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sku, timestamp, batch, activeSku, dealPrice, notes, reportedBy, noticeId } = body;

    // 1. Report Sold Notice from Sales to Master Inventory
    if (action === 'REPORT_SOLD_NOTICE' && sku) {
      const newNotice: SoldNotice = {
        id: `notice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sku,
        dealPrice: dealPrice ? Number(dealPrice) : undefined,
        notes: notes || 'Deal via WhatsApp Sales',
        reportedAt: new Date().toISOString(),
        reportedBy: reportedBy || 'Sales',
      };
      // Prevent duplicate pending notice for same SKU
      global.__bbk_sold_notices = (global.__bbk_sold_notices || []).filter((n) => n.sku !== sku);
      global.__bbk_sold_notices.unshift(newNotice);

      return NextResponse.json({
        success: true,
        message: `Sold notice for ${sku} recorded for Master Inventory`,
        soldNotices: global.__bbk_sold_notices,
      });
    }

    // 2. Dismiss Sold Notice
    if (action === 'DISMISS_SOLD_NOTICE') {
      if (noticeId) {
        global.__bbk_sold_notices = (global.__bbk_sold_notices || []).filter((n) => n.id !== noticeId);
      } else if (sku) {
        global.__bbk_sold_notices = (global.__bbk_sold_notices || []).filter((n) => n.sku !== sku);
      }
      return NextResponse.json({
        success: true,
        soldNotices: global.__bbk_sold_notices,
      });
    }

    // 3. Timestamps & Active SKU sync
    if (batch && typeof batch === 'object') {
      Object.assign(global.__bbk_audit_timestamps!, batch);
    }
    if (sku && timestamp) {
      global.__bbk_audit_timestamps![sku] = timestamp;
    }
    // Only set activeSku if explicitly provided (originating ONLY from Master Inventory)
    if (activeSku !== undefined) {
      global.__bbk_active_sku = activeSku;
    }

    return NextResponse.json({
      success: true,
      timestamps: global.__bbk_audit_timestamps,
      activeSku: global.__bbk_active_sku,
      soldNotices: global.__bbk_sold_notices,
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
