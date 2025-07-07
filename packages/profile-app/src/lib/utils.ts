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

export const formatYearString = (year?: string): string => {
  if (!year) return 'Year missing';

  const lowerYear = year.toLowerCase().trim();

  switch (lowerYear) {
    case 'ongoing':
    case 'current':
    case 'now':
      return 'Now';
    case '':
      return 'Year missing';
    default:
      return year;
  }
};

export const formatDateRange = (from?: string, to?: string): string => {
  const startYear = formatYearString(from);
  const endYear = to ? formatYearString(to) : 'Now';

  return `${startYear} - ${endYear}`;
};

const AVATAR_COLORS = [
  { bg: '#FEE2E2', text: '#BA1F1C' },
  { bg: '#DBE9FC', text: '#2563EB' },
  { bg: '#DDD6FE', text: '#7C3AED' },
  { bg: '#FFEDD5', text: '#EA580C' },
  { bg: '#BBF7D0', text: '#16A34A' },
  { bg: '#FAE8FF', text: '#C026D3' },
  { bg: '#E5E5E5', text: '#525252' },
];

export function generateDefaultAvatar(nickname: string): string {
  if (!nickname) return '';

  const initials = nickname.trim().toUpperCase().substring(0, 2);

  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorSet = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];

  const size = 96;
  const fontSize = size * 0.4;

  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${colorSet.bg}" />
    <text x="${size / 2}" y="${size / 2}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="600" text-anchor="middle" dominant-baseline="central" fill="${colorSet.text}">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
}
