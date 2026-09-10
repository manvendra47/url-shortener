import { api } from './client';
import type { ClickEvent, Link, LinksSummary } from '../types';

export interface CreateLinkPayload {
  originalUrl: string;
  customCode?: string;
  title?: string;
  expiresAt?: string;
  maxClicks?: number;
  password?: string;
  requirePreview?: boolean;
}

export async function fetchLinks(): Promise<{ links: Link[]; summary: LinksSummary }> {
  const { data } = await api.get('/links');
  return data;
}

export async function fetchLink(id: number): Promise<{ link: Link; recentClicks: ClickEvent[] }> {
  const { data } = await api.get(`/links/${id}`);
  return data;
}

export async function createLink(payload: CreateLinkPayload): Promise<Link> {
  const { data } = await api.post('/links', payload);
  return data.link;
}

export async function fetchQrCode(id: number): Promise<{ qrCode: string; shortUrl: string }> {
  const { data } = await api.get(`/links/${id}/qr`);
  return data;
}

export async function toggleLinkActive(id: number, isActive: boolean): Promise<Link> {
  const { data } = await api.patch(`/links/${id}`, { isActive });
  return data.link;
}

export async function updateLinkProtection(
  id: number,
  payload: { requirePreview?: boolean; password?: string; removePassword?: boolean }
): Promise<Link> {
  const { data } = await api.patch(`/links/${id}`, payload);
  return data.link;
}

export async function deleteLink(id: number): Promise<void> {
  await api.delete(`/links/${id}`);
}
