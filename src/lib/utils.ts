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
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  return url;
}
