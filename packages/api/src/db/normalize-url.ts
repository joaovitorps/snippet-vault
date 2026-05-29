export function normalizeDbUrl(url: string): string {
  return url.startsWith("libsql://") ? url : `file:${url}`;
}
