export interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

export type LinkStatus = 'active' | 'disabled' | 'expired' | 'limit_reached';

export interface Link {
  id: number;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  clickCount: number;
  maxClicks: number | null;
  expiresAt: string | null;
  isActive: boolean;
  hasPassword: boolean;
  requirePreview: boolean;
  status: LinkStatus;
  createdAt: string;
}

export interface ClickEvent {
  clicked_at: string;
  referrer: string | null;
  user_agent: string | null;
}

export interface PublicLinkMeta {
  shortCode: string;
  title: string | null;
  hasPassword: boolean;
  requirePreview: boolean;
  originalUrl: string | null;
}

export interface LinksSummary {
  totalLinks: number;
  totalClicks: number;
}

