import fs from 'fs';
import path from 'path';

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function generateTimestampedFilename(extension: string = 'mp4'): string {
  return `output-${Date.now()}.${extension}`;
}
