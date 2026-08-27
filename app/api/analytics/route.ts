import { NextRequest, NextResponse } from 'next/server';
import {
  getGSCMetrics,
  getGA4Metrics,
  getMetaPixelSummary,
  getCommercialFunnel,
} from '@/lib/repositories/analytics-repository';

export async function GET() {
  try {
    const gsc = getGSCMetrics();
    const ga4 = getGA4Metrics();
    const meta = getMetaPixelSummary();
    const funnel = getCommercialFunnel();

    return NextResponse.json({
      gsc,
      ga4,
      meta,
      funnel,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Analytics fetch error' }, { status: 500 });
  }
}
