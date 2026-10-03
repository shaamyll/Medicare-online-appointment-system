import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Builds full image URL for static assets and doctor photos
 * Appends cache-buster version parameter (e.g. updatedAt timestamp) to avoid stale browser cache
 */
export function getImageUrl(path?: string | null, version?: string | number | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const apiUrl = (import.meta.env.VITE_API_URL as string) || '';
  let fullUrl = apiUrl ? `${apiUrl.replace(/\/api\/?$/, '')}${cleanPath}` : cleanPath;
  if (version) {
    const sep = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${sep}v=${encodeURIComponent(String(version))}`;
  }
  return fullUrl;
}

