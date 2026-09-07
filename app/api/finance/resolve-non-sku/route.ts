import { NextRequest, NextResponse } from 'next/server';
import { resolveNonSkuItem } from '@/lib/repositories/finance-repository';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const role = session.user.role;
    if (!['ADMIN', 'FINANCE', 'OPERATOR'].includes(role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const { invoiceNumber, skuTemp, itemTitle, action, targetSku, hppModal, vendorBengkel, notes } = body;

    if (!invoiceNumber || !skuTemp || !action) {
      return NextResponse.json({ error: 'Missing required resolution parameters' }, { status: 400 });
    }

    const success = await resolveNonSkuItem({
      invoiceNumber,
      skuTemp,
      itemTitle: itemTitle || '',
      action,
      targetSku,
      hppModal: Number(hppModal) || 0,
      vendorBengkel,
      notes,
    });

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Resolve Non-SKU API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to resolve non-SKU item' }, { status: 500 });
  }
}
