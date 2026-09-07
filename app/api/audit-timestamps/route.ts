import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistentAuditState,
  savePersistentAuditState,
  SoldNotice,
} from '@/lib/repositories/audit-repository';
import { updateGoogleSheetsTelegramAudit } from '@/lib/repositories/google-sheets-inventory';

export type { SoldNotice };

export async function GET() {
  const state = await getPersistentAuditState();
  return NextResponse.json({
    timestamps: state.timestamps,
    activeSku: state.activeSku,
    soldNotices: state.soldNotices,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sku, timestamp, batch, activeSku, dealPrice, notes, reportedBy, noticeId } = body;

    const currentState = await getPersistentAuditState();

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

      const updatedNotices = (currentState.soldNotices || []).filter((n) => n.sku !== sku);
      updatedNotices.unshift(newNotice);

      const savedState = await savePersistentAuditState({ soldNotices: updatedNotices });

      return NextResponse.json({
        success: true,
        message: `Sold notice for ${sku} recorded for Master Inventory`,
        soldNotices: savedState.soldNotices,
      });
    }

    // 2. Dismiss Sold Notice
    if (action === 'DISMISS_SOLD_NOTICE') {
      let updatedNotices = currentState.soldNotices || [];
      if (noticeId) {
        updatedNotices = updatedNotices.filter((n) => n.id !== noticeId);
      } else if (sku) {
        updatedNotices = updatedNotices.filter((n) => n.sku !== sku);
      }
      const savedState = await savePersistentAuditState({ soldNotices: updatedNotices });
      return NextResponse.json({
        success: true,
        soldNotices: savedState.soldNotices,
      });
    }

    // 3. Timestamps & Active SKU sync
    const newTimestamps: Record<string, string> = {};
    if (batch && typeof batch === 'object') {
      Object.assign(newTimestamps, batch);
    }
    if (sku && timestamp) {
      newTimestamps[sku] = timestamp;
      // Persist directly to Column AG in Google Sheets MASTER_INVENTORY
      updateGoogleSheetsTelegramAudit(sku, timestamp).catch((err) =>
        console.warn(`Could not update Column AG for SKU ${sku}:`, err)
      );
    }

    const savedState = await savePersistentAuditState({
      timestamps: Object.keys(newTimestamps).length > 0 ? newTimestamps : undefined,
      activeSku: activeSku !== undefined ? activeSku : undefined,
    });

    return NextResponse.json({
      success: true,
      timestamps: savedState.timestamps,
      activeSku: savedState.activeSku,
      soldNotices: savedState.soldNotices,
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
