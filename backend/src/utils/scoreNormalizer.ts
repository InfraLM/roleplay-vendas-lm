export function normalizeScore(score: number): number {
  if (score <= 0) return 0;
  if (score <= 1) return Math.round(score * 100); // 0-1 -> 0-100
  if (score <= 10) return Math.round(score * 10); // 0-10 -> 0-100
  return Math.round(score); // already 0-100
}

export function getRadarStatus(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}
