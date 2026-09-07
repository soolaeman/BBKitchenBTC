import { NextResponse } from 'next/server';
import { getLiveMasterInventory } from '@/lib/repositories/inventory-repository';
import { matchOfficialCategory, OFFICIAL_CATEGORIES } from '@/lib/repositories/categories';
import { auditProductSEO } from '@/lib/repositories/seo-repository';

export async function GET() {
  try {
    const allItems = await getLiveMasterInventory();
    const totalCount = allItems.length;

    let healthyCount = 0;
    let needsImprovementCount = 0;
    let problemCount = 0;
    let missingAltCount = 0;
    let missingYoastDescCount = 0;
    let missingKeywordCount = 0;
    let totalScoreSum = 0;

    // Initialize map for all 10 official categories
    const categoryMap = new Map<string, { name: string; count: number; totalScore: number }>();
    for (const cat of OFFICIAL_CATEGORIES) {
      categoryMap.set(cat.slug, {
        name: cat.name,
        count: 0,
        totalScore: 0,
      });
    }

    const problemItems: Array<{
      sku: string;
      title: string;
      category: string;
      location: string;
      score: number;
      issues: string[];
    }> = [];

    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      const report = auditProductSEO(item);
      totalScoreSum += report.overallScore;

      if (report.healthStatus === 'HEALTHY') healthyCount++;
      else if (report.healthStatus === 'NEEDS_IMPROVEMENT') needsImprovementCount++;
      else problemCount++;

      if (!report.imageAltPresent) missingAltCount++;
      if (!report.metaDescription || report.metaDescription.length < 30) missingYoastDescCount++;
      if (!report.focusKeyword) missingKeywordCount++;

      // Real category matching to the 10 official categories
      const official = matchOfficialCategory(item.CATEGORY_NAME || item.PRODUCT_TITLE || '');
      const existingCat = categoryMap.get(official.slug) || {
        name: official.name,
        count: 0,
        totalScore: 0,
      };
      existingCat.count++;
      existingCat.totalScore += report.overallScore;
      categoryMap.set(official.slug, existingCat);

      // Collect all real problem items across all inventory items
      if (report.healthStatus !== 'HEALTHY') {
        const failedChecks = report.checks.filter((c) => !c.passed).map((c) => c.label);
        problemItems.push({
          sku: item.SKU,
          title: item.PRODUCT_TITLE,
          category: official.name,
          location: item.LOKASI_UNIT || item.asal_gudang || 'Jabodetabek',
          score: report.overallScore,
          issues: failedChecks,
        });
      }
    }

    const avgScore = totalCount > 0 ? Math.round(totalScoreSum / totalCount) : 0;

    const contentPillars = Array.from(categoryMap.entries()).map(([slug, data]) => ({
      slug,
      name: data.name,
      skuCount: data.count,
      avgScore: Math.round(data.totalScore / data.count),
      status: data.totalScore / data.count >= 80 ? 'OPTIMAL' : 'NEEDS_OPTIMIZATION',
    }));

    // Sort pillars by count descending
    contentPillars.sort((a, b) => b.skuCount - a.skuCount);

    return NextResponse.json({
      success: true,
      totalCount,
      avgScore,
      healthyCount,
      needsImprovementCount,
      problemCount,
      missingAltCount,
      missingYoastDescCount,
      missingKeywordCount,
      contentPillars,
      problemItems,
      auditedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to compute SEO audit summary' },
      { status: 500 }
    );
  }
}
