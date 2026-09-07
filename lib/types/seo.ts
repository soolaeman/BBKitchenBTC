// SEO Quality and Content Pipeline Domain Types

export type SEOHealthStatus = 'HEALTHY' | 'NEEDS_IMPROVEMENT' | 'PROBLEM';

export interface SEOCheckItem {
  key: string;
  label: string;
  passed: boolean;
  score: number; // 0 to 100 weighting
  message: string;
  recommendation?: string;
}

export interface SEOAuditReport {
  targetId: string;
  title: string;
  type: 'PRODUCT' | 'ARTICLE';
  slug: string;
  healthStatus: SEOHealthStatus;
  overallScore: number; // 0-100
  checks: SEOCheckItem[];
  passedCount: number;
  totalCount: number;
  focusKeyword: string;
  metaDescription: string;
  h1: string;
  wordCount: number;
  imageAltPresent: boolean;
  internalLinksCount: number;
  canonicalUrl: string;
  schemaValid: boolean;
  lastAudited: string;
}

export type ArticlePipelineStage =
  | 'IDEA'
  | 'KEYWORD'
  | 'BRIEF'
  | 'DRAFT'
  | 'REVIEW'
  | 'PUBLISHED'
  | 'INDEXED'
  | 'RANKING';

export interface SEOArticle {
  id: string;
  title: string;
  slug: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  searchIntent: 'COMMERCIAL' | 'INFORMATIONAL' | 'TRANSACTIONAL' | 'NAVIGATIONAL';
  stage: ArticlePipelineStage;
  author: string;
  assignedTo: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  relatedCategorySlug: string;
  relatedSkus: string[];
  yoastTitle: string;
  yoastMetaDesc: string;
  wordCount: number;
  internalLinksCount: number;
  gscClicks30d?: number;
  gscImpressions30d?: number;
  gscPosition?: number;
  publishedDate?: string;
  updatedAt: string;
}

export interface SEOKeywordItem {
  keyword: string;
  intent: 'COMMERCIAL' | 'INFORMATIONAL' | 'TRANSACTIONAL' | 'NAVIGATIONAL';
  volumeMonthly: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  categorySlug: string;
  targetSku?: string;
  cpcEst: string;
  source: 'GOOGLE_SUGGEST' | 'MARKETPLACE' | 'INTERNAL_SHEETS';
}

export interface TechnicalSEOAudit {
  domain: string;
  robotsStatus: 'VALID' | 'WARNING' | 'BLOCKED';
  robotsDetails: string;
  sitemapStatus: 'VALID' | 'NOT_FOUND' | 'WARNING';
  sitemapUrl: string;
  sitemapUrlsCount: number;
  ttfbMs: number;
  sslSecure: boolean;
  canonicalValid: boolean;
  mobileFriendly: boolean;
  schemaValid: boolean;
  coreWebVitalsScore: number;
  lastAudited: string;
}

export interface OffPageSignal {
  id: string;
  sourceDomain: string;
  sourceType: 'MEDIA_CULINARY' | 'FORUM_RESTO' | 'DIRECTORY' | 'SOCIAL_SIGNAL';
  targetUrl: string;
  anchorText: string;
  domainAuthority: number;
  dateDiscovered: string;
  status: 'ACTIVE' | 'PENDING' | 'OPPORTUNITY';
}

export interface RankTrackItem {
  id: string;
  keyword: string;
  position: number;
  prevPosition: number;
  impressions30d: number;
  clicks30d: number;
  ctr: string;
  landingPage: string;
  searchEngine: 'Google.co.id (Mobile)';
  rankingChange: 'UP' | 'DOWN' | 'STABLE';
}
