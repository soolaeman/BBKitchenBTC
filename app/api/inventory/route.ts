import { NextRequest, NextResponse } from 'next/server';
import { queryInventory, markUnitAsSold } from '@/lib/repositories/inventory-repository';
import { UserRole } from '@/lib/types/auth';
import { queryGoogleSheetsInventory, updateGoogleSheetsStockStatus } from '@/lib/repositories/google-sheets-inventory';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const location = searchParams.get('location') || undefined;
    const warehouse = searchParams.get('warehouse') || undefined;
    const statusUnit = searchParams.get('statusUnit') || undefined;
    const statusPipeline = searchParams.get('statusPipeline') || undefined;
    const guardrailStatus = searchParams.get('guardrailStatus') || undefined;
    const isDirtyParam = searchParams.get('isDirty');
    const isDirty = isDirtyParam !== null ? isDirtyParam === 'true' : undefined;
    const hasProductIdParam = searchParams.get('hasProductId');
    const hasProductId = hasProductIdParam !== null ? hasProductIdParam === 'true' : undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const sortBy = (searchParams.get('sortBy') as any) || 'TANGGAL_MASUK';
    const sortOrder = (searchParams.get('sortOrder') as any) || 'desc';
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const pageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 25;

    // Role is injected by authenticated server middleware; never trust a client role parameter.
    const session = await auth();
    if (!session?.user?.role) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const roleHeader = session.user.role as UserRole;

    const rawSource = (process.env.BBK_INVENTORY_SOURCE || '').replace(/['"]/g, '').trim().toLowerCase();
    const hasSheetsConfig = Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    const isGoogleSheets = rawSource === 'google_sheets' || (rawSource !== 'mock' && hasSheetsConfig);

    const result = isGoogleSheets
      ? await queryGoogleSheetsInventory(
          {
            search,
            category,
            location,
            warehouse,
            statusUnit,
            statusPipeline,
            guardrailStatus,
            isDirty,
            hasProductId,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder,
            page,
            pageSize,
          },
          roleHeader
        )
      : queryInventory(
          {
            search,
            category,
            location,
            warehouse,
            statusUnit,
            statusPipeline,
            guardrailStatus,
            isDirty,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder,
            page,
            pageSize,
          },
          roleHeader
        );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Inventory API Query Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to query inventory',
        source: process.env.BBK_INVENTORY_SOURCE,
        hasSheetsId: Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sku, dealPrice, notes, status } = body;

    const session = await auth();
    if (!session?.user?.role) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const roleHeader = session.user.role as UserRole;
    if (roleHeader !== 'ADMIN' && roleHeader !== 'OPERATOR') {
      return NextResponse.json(
        { error: 'Unauthorized: Only ADMIN and OPERATOR can mark units as SOLD or edit inventory.' },
        { status: 403 }
      );
    }

    if (!sku) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }

    const rawSource = (process.env.BBK_INVENTORY_SOURCE || '').replace(/['"]/g, '').trim().toLowerCase();
    const hasSheetsConfig = Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    const isGoogleSheets = rawSource === 'google_sheets' || (rawSource !== 'mock' && hasSheetsConfig);

    if (action === 'MARK_AS_SOLD' || status === 'SOLD') {
      if (isGoogleSheets) {
        const gsResult = await updateGoogleSheetsStockStatus({
          sku,
          status: 'SOLD',
          dealPrice: dealPrice ? Number(dealPrice) : undefined,
          notes,
        });

        if (!gsResult.success) {
          return NextResponse.json({ error: gsResult.error }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          message: `Unit ${sku} successfully marked as SOLD in Google Sheets`,
        });
      }

      const result = markUnitAsSold(sku, dealPrice, notes);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({ success: true, item: result.item });
    }

    if (action === 'MARK_AS_READY' || status === 'READY') {
      if (isGoogleSheets) {
        const gsResult = await updateGoogleSheetsStockStatus({
          sku,
          status: 'READY',
          notes,
        });

        if (!gsResult.success) {
          return NextResponse.json({ error: gsResult.error }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          message: `Unit ${sku} successfully marked as READY in Google Sheets`,
        });
      }

      return NextResponse.json({ success: true, message: `Unit ${sku} set to READY (mock)` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process inventory update' }, { status: 500 });
  }
}
