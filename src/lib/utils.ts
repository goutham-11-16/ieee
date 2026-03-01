import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDriveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.includes('drive.google.com')) {
    let fileId = '';
    const matchFileD = url.match(/\/d\/(.+?)\//);
    const matchUc = url.match(/id=([^&]+)/);
    if (matchFileD && matchFileD[1]) {
      fileId = matchFileD[1];
    } else if (matchUc && matchUc[1]) {
      fileId = matchUc[1];
    }
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return url;
}

export function formatDateIST(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...options
  });
}

export function formatDateTimeIST(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options
  });
}
