import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export function getDirname(metaUrl: string): string {
  return dirname(fileURLToPath(metaUrl));
}

export function getFilename(metaUrl: string): string {
  return fileURLToPath(metaUrl);
}
