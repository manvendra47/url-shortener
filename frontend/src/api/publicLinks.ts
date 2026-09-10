import { api } from './client';
import type { PublicLinkMeta } from '../types';

export async function fetchPublicLinkMeta(code: string): Promise<PublicLinkMeta> {
  const { data } = await api.get(`/public/links/${code}`);
  return data;
}

export async function confirmPublicLink(
  code: string,
  password?: string
): Promise<{ originalUrl: string }> {
  const { data } = await api.post(`/public/links/${code}/confirm`, password ? { password } : {});
  return data;
}
