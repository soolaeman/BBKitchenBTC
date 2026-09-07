import { NextRequest, NextResponse } from 'next/server';
import { getRawMasterInventory, updateItemSEOMetadata } from '@/lib/repositories/inventory-repository';
import { generateAutoFixMetadata } from '@/lib/repositories/seo-repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku, batch } = body;

    const allItems = getRawMasterInventory();

    if (sku) {
      const item = allItems.find((i) => i.SKU.toLowerCase() === String(sku).toLowerCase());
      if (!item) {
        return NextResponse.json({ error: `SKU ${sku} not found` }, { status: 404 });
      }

      const fixed = generateAutoFixMetadata(item);
      updateItemSEOMetadata(item.SKU, fixed);

      return NextResponse.json({
        success: true,
        sku: item.SKU,
        updated: fixed,
      });
    }

    if (batch) {
      // Fix all items that have missing Yoast keyword or missing alt tag
      let fixedCount = 0;
      for (const item of allItems) {
        if (!item.YOAST_KEYWORD || !item.image_alt || !item.SEO_TITLE) {
          const fixed = generateAutoFixMetadata(item);
          updateItemSEOMetadata(item.SKU, fixed);
          fixedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil mengoptimasi otomatis metadata SEO pada ${fixedCount} unit SKU.`,
        fixedCount,
        totalItems: allItems.length,
      });
    }

    return NextResponse.json({ error: 'Missing sku or batch parameter' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to apply autofix' },
      { status: 500 }
    );
  }
}
