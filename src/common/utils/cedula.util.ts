export function normalizeCedula(value: any): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().toUpperCase();
  const cleaned = s.replace(/[\s.\-]/g, '');
  const withoutPrefix = cleaned.replace(/^[VE]/, '');
  if (!/^\d+$/.test(withoutPrefix)) return null;
  return withoutPrefix;
}

export function isValidCedulaVE(value: any): boolean {
  const normalized = normalizeCedula(value);
  if (!normalized) return false;
  const len = normalized.length;
  return len >= 6 && len <= 10;
}

export function formatCedulaForStorage(value: any): string | null {
  return normalizeCedula(value);
}
