import { NextRequest, NextResponse } from 'next/server';
import { queryInventory, markUnitAsSold } from '@/lib/repositories/inventory-repository';
import { UserRole } from '@/lib/types/auth';
import { queryGoogleSheetsInventory } from '@/lib/repositories/google-sheets-inventory';
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

    const result = process.env.BBK_INVENTORY_SOURCE === 'google_sheets'
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
    return NextResponse.json({ error: error.message || 'Failed to query inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sku, dealPrice, notes } = body;

    const session = await auth();
    if (!session?.user?.role) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const roleHeader = session.user.role as UserRole;
    if (roleHeader !== 'ADMIN' && roleHeader !== 'OPERATOR') {
      return NextResponse.json(
        { error: 'Unauthorized: Only ADMIN and OPERATOR can mark units as SOLD or edit inventory.' },
        { status: 403 }
      );
    }

    if (action === 'MARK_AS_SOLD') {
      if (!sku) {
        return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
      }

      const result = markUnitAsSold(sku, dealPrice, notes);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({ success: true, item: result.item });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process inventory update' }, { status: 500 });
  }
}
