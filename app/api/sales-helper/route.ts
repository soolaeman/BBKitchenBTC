import { NextRequest, NextResponse } from 'next/server';
import { getSalesHelperProducts } from '../../../lib/woocommerce-sales-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const products = await getSalesHelperProducts({
      q: searchParams.get('q') || '',
      sku: searchParams.get('sku') || '',
    });

    return NextResponse.json({
      success: true,
      total: products.length,
      products,
    });
  } catch (error) {
    console.error('Error fetching sales helper products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
