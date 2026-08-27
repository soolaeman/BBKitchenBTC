// Social Media Content Center Domain Types

export type SocialChannel =
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'TIKTOK'
  | 'WHATSAPP_STORY'
  | 'GOOGLE_BUSINESS';

export type SocialContentStatus =
  | 'IDEA'
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface SocialContentItem {
  id: string;
  topic: string;
  channel: SocialChannel;
  status: SocialContentStatus;
  caption: string;
  relatedSku?: string;
  relatedSkuTitle?: string;
  callToAction: string;
  destinationUrl: string;
  mediaType: 'IMAGE' | 'CAROUSEL' | 'REEL' | 'VIDEO' | 'TEXT_STORY';
  mediaPreviewUrl?: string;
  scheduledDate?: string;
  publishedDate?: string;
  assignedCreator: string;
  performanceNotes?: string;
  engagementStats?: {
    likes?: number;
    shares?: number;
    saves?: number;
    comments?: number;
    waInquiries?: number;
  };
}
