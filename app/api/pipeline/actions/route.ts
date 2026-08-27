import { NextRequest, NextResponse } from 'next/server';
import { updatePipelineStatus } from '@/lib/repositories/inventory-repository';
import { PipelineStatus } from '@/lib/types/inventory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku, newStatus, clearDirty } = body;

    if (!sku || !newStatus) {
      return NextResponse.json({ error: 'SKU and newStatus are required' }, { status: 400 });
    }

    const success = updatePipelineStatus(sku, newStatus as PipelineStatus, clearDirty ?? true);
    if (!success) {
      return NextResponse.json({ error: `Unit with SKU ${sku} not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Unit ${sku} pipeline status updated to ${newStatus}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Pipeline update failed' }, { status: 500 });
  }
}
