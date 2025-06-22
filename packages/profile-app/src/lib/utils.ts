import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getValidUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export const getWebsiteDisplayName = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    const fullUrl =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
    const parsedUrl = new URL(fullUrl);
    let hostname = parsedUrl.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    if (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '') {
      const path = parsedUrl.pathname.startsWith('/')
        ? parsedUrl.pathname.substring(1)
        : parsedUrl.pathname;
      const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
      if (cleanPath) {
        hostname = `${hostname}/${cleanPath}`;
      }
    }
    return hostname;
  } catch (e) {
    let displayName = url.replace(/^https?:\/\//, '');
    if (displayName.startsWith('www.')) {
      displayName = displayName.substring(4);
    }
    if (displayName.endsWith('/')) {
      displayName = displayName.slice(0, -1);
    }
    return displayName;
  }
};

export const normalizeNickname = (nickname: string): string => {
  return nickname.toLowerCase().trim();
};

export const createNicknameUrl = (
  nickname: string,
  path: string = '',
): string => {
  const normalized = normalizeNickname(nickname);
  return `/${normalized}${path}`;
};
