/**
 * Matches a path or URL against HR-defined patterns (substring / prefix style).
 */
export function pathMatchesAllowed(path: string, patterns: string[]): boolean {
  const normalized = path.trim().toLowerCase();
  if (!normalized) return false;
  return patterns.some((p) => {
    const pat = p.trim().toLowerCase();
    if (!pat) return false;
    return normalized.includes(pat) || normalized.startsWith(pat);
  });
}
