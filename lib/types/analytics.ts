// Analytics, Search Console, GA4 & Meta Pixel Domain Types

export interface GSCMetricSummary {
  isConnected: boolean;
  propertyUrl: string;
  lastUpdated: string;
  period: string;
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  indexingStatus: {
    indexedCount: number;
    notIndexedCount: number;
    issues: Array<{
      reason: string;
      affectedPagesCount: number;
      severity: 'ERROR' | 'WARNING';
    }>;
  };
}

export interface GA4MetricSummary {
  isConnected: boolean;
  measurementId: string;
  period: string;
  activeUsers: number;
  totalSessions: number;
  bounceRate: number;
  averageSessionDuration: number;
  productViews: number;
  whatsAppInquiryClicks: number;
  conversionRateWA: number;
  trafficSources: Array<{
    source: string;
    sessions: number;
    percentage: number;
    waConversions: number;
  }>;
}

export interface MetaPixelSummary {
  isConnected: boolean;
  pixelId: string;
  status: 'ACTIVE' | 'PENDING' | 'DISCONNECTED';
  eventsTracked24h: {
    PageView: number;
    ViewContent: number;
    Contact: number;
    Lead: number;
  };
}

export interface FunnelStage {
  stage: string;
  name: string;
  count: number;
  conversionFromPrevious: number;
  statusType: 'TRACKED' | 'ESTIMATED' | 'NOT_AVAILABLE';
  notes: string;
}

export interface CommercialFunnel {
  period: string;
  stages: FunnelStage[];
  summaryMessage: string;
}
