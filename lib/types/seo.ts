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
